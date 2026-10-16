import { fail } from '@sveltejs/kit';
import { and, eq, gte, inArray, ne } from 'drizzle-orm';
import { db } from './db/index.js';
import { users, socialAccounts } from './db/schema.js';
import { invalidateUserSessions } from './auth.js';
import { isUniqueViolation, parseAccounts, findTaken, takenMessage } from './accounts.js';
import { logAdmin } from './audit.js';
import { notify, retractNotifications } from './notify.js';
import { PLATFORMS, EWALLETS } from '#lib/constants.js';

const reviewed = (admin) => ({ reviewedBy: admin.id, reviewedAt: new Date() });
const MIN_REASON = 5;
// tombol "Batalkan" pada notifikasi hanya berlaku sebentar setelah aksi
const UNDO_WINDOW_MS = 10 * 60 * 1000;

const userLabel = (u) => `${u.nickname ?? '—'} <${u.email}>`;
const accountLabel = (a) => `${PLATFORMS[a.platform]?.label ?? a.platform} @${a.username}`;

/** Alasan wajib: kembalikan pesan error bila kosong / terlalu pendek */
function requireReason(note) {
	if (!note || note.length < MIN_REASON) return fail(400, { error: `Alasan wajib diisi (minimal ${MIN_REASON} karakter)` });
	return null;
}

async function target(form, admin) {
	const id = Number(form.get('id'));
	const [u] = await db.select().from(users).where(eq(users.id, id));
	if (!u) return { err: fail(404, { error: 'User tidak ditemukan' }) };
	if (u.id === admin.id) return { err: fail(400, { error: 'Tidak bisa mengubah akun sendiri' }) };
	return { u, form, note: String(form.get('note') ?? '').trim() || null };
}

/** Aksi admin terhadap user — dipakai di daftar user & halaman detail. */
export const userActions = {
	// admin membuat user/admin baru yang langsung terverifikasi; user tinggal login Google dengan email ini
	createUser: async ({ request, locals }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const nickname = String(form.get('nickname') ?? '').trim();
		const role = form.get('role') === 'admin' ? 'admin' : 'user';
		const ewalletProvider = String(form.get('ewalletProvider') ?? '') || null;
		const ewalletNumber = String(form.get('ewalletNumber') ?? '').replace(/[\s-]/g, '') || null;

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { error: 'Email tidak valid' });
		if (nickname.length < 2 || nickname.length > 50) return fail(400, { error: 'Nama panggilan 2–50 karakter' });
		if (role === 'admin' && form.get('confirmAdmin') !== '1') return fail(400, { error: 'Centang konfirmasi untuk membuat admin' });
		// user biasa wajib e-wallet (dibutuhkan untuk rekap & pembayaran); admin opsional
		if (role === 'user' || ewalletNumber) {
			if (!EWALLETS.includes(ewalletProvider)) return fail(400, { error: 'Pilih penyedia e-wallet' });
			if (!/^(\+62|62|0)8\d{7,12}$/.test(ewalletNumber ?? '')) return fail(400, { error: 'Nomor e-wallet tidak valid (contoh: 081234567890)' });
		}
		const { accounts, error } = parseAccounts(form);
		if (error) return fail(400, { error });

		const [exists] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email));
		if (exists && exists.status !== 'incomplete') return fail(400, { error: 'Email ini sudah terdaftar' });

		let created;
		try {
			created = await db.transaction(async (tx) => {
				const taken = await findTaken(tx, accounts);
				if (taken.length) throw Object.assign(new Error(takenMessage(taken)), { userFacing: true });
				const values = {
					email,
					nickname,
					role,
					ewalletProvider: ewalletNumber ? ewalletProvider : null,
					ewalletNumber,
					status: 'approved',
					registeredAt: new Date(),
					...reviewed(locals.user)
				};
				// user yang pernah login Google tapi belum mengisi form → lengkapi datanya
				const [u] = exists
					? await tx.update(users).set(values).where(eq(users.id, exists.id)).returning()
					: await tx.insert(users).values(values).returning();
				if (accounts.length)
					await tx.insert(socialAccounts).values(accounts.map((a) => ({ ...a, userId: u.id, status: 'approved', ...reviewed(locals.user) })));
				await logAdmin(
					locals.user,
					[
						{ action: 'createUser', targetType: 'user', targetId: u.id, targetLabel: userLabel(u), meta: { role, accounts: accounts.map((a) => `${a.platform}:@${a.username}`) } },
						role === 'admin' ? { action: 'grantAdmin', targetType: 'user', targetId: u.id, targetLabel: userLabel(u) } : null
					],
					tx
				);
				await notify({ userId: u.id, type: 'user_approved', title: 'Selamat datang di Retwepo 👋', body: 'Akun Anda dibuat oleh admin dan sudah terverifikasi.', link: role === 'admin' ? '/admin' : '/app' }, tx);
				return u;
			});
		} catch (e) {
			if (e.userFacing) return fail(400, { error: e.message });
			if (isUniqueViolation(e)) return fail(400, { error: 'Email atau akun sosmed sudah terdaftar' });
			throw e;
		}
		return { success: `${role === 'admin' ? 'Admin' : 'User'} ${created.nickname} dibuat${accounts.length ? ` dengan ${accounts.length} akun sosmed` : ''}`, createdId: created.id };
	},

	approveUser: async ({ request, locals }) => {
		const { u, err } = await target(await request.formData(), locals.user);
		if (err) return err;
		if (u.status !== 'pending') return fail(400, { error: 'User ini tidak sedang menunggu persetujuan' });
		const accountIds = await db.transaction(async (tx) => {
			await tx.update(users).set({ status: 'approved', statusNote: null, ...reviewed(locals.user) }).where(eq(users.id, u.id));
			// akun sosmed yang diajukan saat pendaftaran ikut disetujui
			const accs = await tx
				.update(socialAccounts)
				.set({ status: 'approved', ...reviewed(locals.user) })
				.where(and(eq(socialAccounts.userId, u.id), eq(socialAccounts.status, 'pending')))
				.returning({ id: socialAccounts.id });
			await logAdmin(locals.user, { action: 'approveUser', targetType: 'user', targetId: u.id, targetLabel: userLabel(u), meta: { accountIds: accs.map((a) => a.id) } }, tx);
			await notify({ userId: u.id, type: 'user_approved', title: 'Pendaftaran Anda disetujui 🎉', body: 'Akun sosmed yang Anda ajukan sudah bisa dipakai untuk membuat rekap.', link: '/app/recaps/new' }, tx);
			return accs.map((a) => a.id);
		});
		// data untuk tombol "Batalkan" di notifikasi
		return { success: `${u.nickname ?? u.email} disetujui`, undo: { action: 'undoApproveUser', id: u.id, accountIds } };
	},

	undoApproveUser: async ({ request, locals }) => {
		const form = await request.formData();
		const { u, err } = await target(form, locals.user);
		if (err) return err;
		const fresh = u.status === 'approved' && u.reviewedBy === locals.user.id && Date.now() - new Date(u.reviewedAt).getTime() < UNDO_WINDOW_MS;
		if (!fresh) return fail(400, { error: 'Persetujuan ini sudah tidak bisa dibatalkan' });
		const accountIds = form.getAll('accountId').map(Number).filter(Boolean);
		await db.transaction(async (tx) => {
			await tx.update(users).set({ status: 'pending', reviewedBy: null, reviewedAt: null }).where(eq(users.id, u.id));
			if (accountIds.length)
				await tx
					.update(socialAccounts)
					.set({ status: 'pending', reviewedBy: null, reviewedAt: null })
					.where(and(inArray(socialAccounts.id, accountIds), eq(socialAccounts.userId, u.id)));
			await logAdmin(locals.user, { action: 'undoApproveUser', targetType: 'user', targetId: u.id, targetLabel: userLabel(u) }, tx);
			await retractNotifications([u.id], ['user_approved'], UNDO_WINDOW_MS, tx);
		});
		return { success: `Persetujuan ${u.nickname ?? u.email} dibatalkan` };
	},

	rejectUser: async ({ request, locals }) => {
		const { u, note, err } = await target(await request.formData(), locals.user);
		if (err) return err;
		const bad = requireReason(note);
		if (bad) return bad;
		await db.transaction(async (tx) => {
			await tx.update(users).set({ status: 'rejected', statusNote: note, ...reviewed(locals.user) }).where(eq(users.id, u.id));
			// lepaskan akun sosmed yang belum disetujui supaya bisa didaftarkan ulang
			await tx
				.update(socialAccounts)
				.set({ status: 'rejected', statusNote: note, ...reviewed(locals.user) })
				.where(and(eq(socialAccounts.userId, u.id), eq(socialAccounts.status, 'pending')));
			await logAdmin(locals.user, { action: 'rejectUser', targetType: 'user', targetId: u.id, targetLabel: userLabel(u), note }, tx);
			await notify({ userId: u.id, type: 'user_rejected', title: 'Pendaftaran Anda ditolak', body: `Alasan: ${note}`, link: '/register' }, tx);
		});
		return { success: `${u.nickname ?? u.email} ditolak` };
	},

	suspendUser: async ({ request, locals }) => {
		const { u, note, err } = await target(await request.formData(), locals.user);
		if (err) return err;
		const bad = requireReason(note);
		if (bad) return bad;
		await db.update(users).set({ status: 'suspended', statusNote: note, ...reviewed(locals.user) }).where(eq(users.id, u.id));
		await invalidateUserSessions(u.id);
		await logAdmin(locals.user, { action: 'suspendUser', targetType: 'user', targetId: u.id, targetLabel: userLabel(u), note });
		await notify({ userId: u.id, type: 'user_suspended', title: 'Akun Anda ditangguhkan', body: `Alasan: ${note}` });
		return { success: `${u.nickname ?? u.email} ditangguhkan` };
	},

	reactivateUser: async ({ request, locals }) => {
		const { u, err } = await target(await request.formData(), locals.user);
		if (err) return err;
		await db.update(users).set({ status: 'approved', statusNote: null, ...reviewed(locals.user) }).where(eq(users.id, u.id));
		await logAdmin(locals.user, { action: 'reactivateUser', targetType: 'user', targetId: u.id, targetLabel: userLabel(u), meta: { previousNote: u.statusNote } });
		await notify({ userId: u.id, type: 'user_reactivated', title: 'Akun Anda aktif kembali', body: 'Anda bisa membuat rekap lagi.', link: '/app' });
		return { success: `${u.nickname ?? u.email} diaktifkan kembali` };
	},

	toggleAdmin: async ({ request, locals }) => {
		const { u, form, err } = await target(await request.formData(), locals.user);
		if (err) return err;
		const grant = u.role !== 'admin';
		// menjadikan admin wajib mengetik email user sebagai konfirmasi
		if (grant && String(form.get('confirm') ?? '').trim().toLowerCase() !== u.email.toLowerCase())
			return fail(400, { error: 'Email konfirmasi tidak cocok' });
		await db.update(users).set({ role: grant ? 'admin' : 'user' }).where(eq(users.id, u.id));
		if (!grant) await invalidateUserSessions(u.id);
		await logAdmin(locals.user, { action: grant ? 'grantAdmin' : 'revokeAdmin', targetType: 'user', targetId: u.id, targetLabel: userLabel(u) });
		return { success: `${u.nickname ?? u.email} sekarang ${grant ? 'admin' : 'member biasa'}` };
	}
};

/** Aksi admin terhadap akun sosmed */
export const accountActions = {
	// admin menambahkan akun sosmed untuk user; langsung terverifikasi
	addAccount: async ({ request, locals }) => {
		const form = await request.formData();
		const userId = Number(form.get('userId'));
		const [u] = await db.select().from(users).where(eq(users.id, userId));
		if (!u) return fail(400, { error: 'Pilih user terlebih dahulu' });
		if (u.status !== 'approved') return fail(400, { error: 'Akun hanya bisa ditambahkan untuk user yang sudah terverifikasi' });

		const { accounts, error } = parseAccounts(form);
		if (error) return fail(400, { error });
		if (accounts.length !== 1) return fail(400, { error: 'Isi platform dan username akun' });
		const acc = accounts[0];

		let row;
		try {
			row = await db.transaction(async (tx) => {
				const taken = await findTaken(tx, [acc]);
				if (taken.length) throw Object.assign(new Error(taken[0].userId === u.id ? 'Akun ini sudah ada di daftar user tersebut' : takenMessage(taken)), { userFacing: true });
				const [a] = await tx
					.insert(socialAccounts)
					.values({ ...acc, userId: u.id, status: 'approved', ...reviewed(locals.user) })
					.returning();
				await logAdmin(locals.user, { action: 'addAccount', targetType: 'account', targetId: a.id, targetLabel: `${accountLabel(a)} · milik ${userLabel(u)}` }, tx);
				await notify({ userId: u.id, type: 'account_approved', title: `Admin menambahkan akun ${accountLabel(a)}`, body: 'Akun ini sudah terverifikasi dan bisa langsung dipakai untuk rekap.', link: `/app/recaps/new?account=${a.id}` }, tx);
				return a;
			});
		} catch (e) {
			if (e.userFacing) return fail(400, { error: e.message });
			if (isUniqueViolation(e)) return fail(400, { error: 'Akun tersebut baru saja didaftarkan' });
			throw e;
		}
		return { success: `${accountLabel(row)} ditambahkan untuk ${u.nickname ?? u.email}` };
	},

	approveAccount: async ({ request, locals }) => {
		const ids = (await request.formData()).getAll('id').map(Number).filter(Boolean);
		if (!ids.length) return fail(400, { error: 'Tidak ada akun dipilih' });
		try {
			const res = await db
				.update(socialAccounts)
				.set({ status: 'approved', statusNote: null, ...reviewed(locals.user) })
				.where(and(inArray(socialAccounts.id, ids), ne(socialAccounts.status, 'approved')))
				.returning();
			await logAdmin(
				locals.user,
				res.map((a) => ({ action: 'approveAccount', targetType: 'account', targetId: a.id, targetLabel: accountLabel(a) }))
			);
			await notify(
				res.map((a) => ({ userId: a.userId, type: 'account_approved', title: `Akun ${accountLabel(a)} disetujui`, body: 'Akun ini sekarang bisa dipakai untuk membuat rekap.', link: `/app/recaps/new?account=${a.id}` }))
			);
			return {
				success: `${res.length} akun disetujui`,
				undo: res.length ? { action: 'undoApproveAccount', ids: res.map((a) => a.id) } : null
			};
		} catch (e) {
			// akun yang pernah ditolak lalu didaftarkan orang lain
			if (isUniqueViolation(e)) return fail(400, { error: 'Akun yang sama sudah aktif dimiliki user lain' });
			throw e;
		}
	},

	undoApproveAccount: async ({ request, locals }) => {
		const ids = (await request.formData()).getAll('id').map(Number).filter(Boolean);
		if (!ids.length) return fail(400, { error: 'Tidak ada akun' });
		const res = await db
			.update(socialAccounts)
			.set({ status: 'pending', reviewedBy: null, reviewedAt: null })
			.where(
				and(
					inArray(socialAccounts.id, ids),
					eq(socialAccounts.status, 'approved'),
					eq(socialAccounts.reviewedBy, locals.user.id),
					gte(socialAccounts.reviewedAt, new Date(Date.now() - UNDO_WINDOW_MS))
				)
			)
			.returning();
		if (!res.length) return fail(400, { error: 'Persetujuan ini sudah tidak bisa dibatalkan' });
		await logAdmin(locals.user, res.map((a) => ({ action: 'undoApproveAccount', targetType: 'account', targetId: a.id, targetLabel: accountLabel(a) })));
		await retractNotifications([...new Set(res.map((a) => a.userId))], ['account_approved'], UNDO_WINDOW_MS);
		return { success: `Persetujuan ${res.length} akun dibatalkan` };
	},

	rejectAccount: async ({ request, locals }) => {
		const form = await request.formData();
		const ids = form.getAll('id').map(Number).filter(Boolean);
		const note = String(form.get('note') ?? '').trim() || null;
		if (!ids.length) return fail(400, { error: 'Tidak ada akun dipilih' });
		const bad = requireReason(note);
		if (bad) return bad;
		const before = await db.select().from(socialAccounts).where(inArray(socialAccounts.id, ids));
		const res = await db
			.update(socialAccounts)
			.set({ status: 'rejected', statusNote: note, ...reviewed(locals.user) })
			.where(inArray(socialAccounts.id, ids))
			.returning({ id: socialAccounts.id });
		// akun yang sebelumnya aktif dicatat sebagai pencabutan verifikasi
		await logAdmin(
			locals.user,
			before.map((a) => ({
				action: a.status === 'approved' ? 'revokeAccount' : 'rejectAccount',
				targetType: 'account',
				targetId: a.id,
				targetLabel: accountLabel(a),
				note
			}))
		);
		const owners = await db.select({ id: users.id, status: users.status }).from(users).where(inArray(users.id, [...new Set(before.map((a) => a.userId))]));
		const verified = new Set(owners.filter((o) => o.status === 'approved').map((o) => o.id));
		await notify(
			before
				.filter((a) => verified.has(a.userId))
				.map((a) => ({
					userId: a.userId,
					type: a.status === 'approved' ? 'account_revoked' : 'account_rejected',
					title: a.status === 'approved' ? `Verifikasi akun ${accountLabel(a)} dicabut` : `Akun ${accountLabel(a)} ditolak`,
					body: `Alasan: ${note}`,
					link: '/app/accounts'
				}))
		);
		return { success: `${res.length} akun ditolak` };
	}
};

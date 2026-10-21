import { fail } from '@sveltejs/kit';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { socialAccounts } from '#lib/server/db/schema.js';
import { parseAccounts, findTaken, takenMessage, isUniqueViolation, usernameTaken } from '#lib/server/accounts.js';
import { normalizeUsername, PLATFORMS, mismatchedUsername } from '#lib/constants.js';
import { checkLimits, waitText } from '#lib/server/ratelimit.js';

export async function load({ locals }) {
	const accounts = await db.execute(sql`
		SELECT a.*, count(r.id)::int AS recaps, max(r.posted_at) AS last_at
		FROM social_accounts a LEFT JOIN active_recaps r ON r.social_account_id = a.id
		WHERE a.user_id = ${locals.user.id}
		GROUP BY a.id ORDER BY a.created_at`);

	// saran ganti username: username yang paling sering dipakai di link rekap tapi berbeda dari akunnya
	const recent = await db.execute(sql`
		SELECT r.social_account_id, r.url FROM active_recaps r
		WHERE r.user_id = ${locals.user.id} AND r.url IS NOT NULL AND r.posted_at >= now() - interval '60 days'`);
	const list = [...accounts].map((a) => {
		if (a.status !== 'approved' || a.pending_username) return a;
		const tally = {};
		for (const r of recent) if (r.social_account_id === a.id) {
			const x = mismatchedUsername(r.url, a);
			if (x) tally[x] = (tally[x] ?? 0) + 1;
		}
		const [suggested, count] = Object.entries(tally).sort((p, q) => q[1] - p[1])[0] ?? [];
		return { ...a, suggested: suggested ?? null, suggested_count: count ?? 0 };
	});
	return { accounts: list };
}

export const actions = {
	add: async ({ request, locals }) => {
		const { accounts, error } = parseAccounts(await request.formData());
		if (error) return fail(400, { error });
		if (!accounts.length) return fail(400, { error: 'Isi username akun' });
		const limit = checkLimits([[`account-add:${locals.user.id}`, 10, 60 * 60 * 1000]]);
		if (!limit.ok) return fail(429, { error: `Terlalu banyak pengajuan akun. Coba lagi dalam ${waitText(limit.retryAfter)}.` });

		try {
			await db.transaction(async (tx) => {
				const taken = await findTaken(tx, accounts);
				if (taken.length) {
					const mine = taken.every((t) => t.userId === locals.user.id);
					throw Object.assign(new Error(mine ? 'Akun tersebut sudah ada di daftar Anda' : takenMessage(taken)), {
						userFacing: true
					});
				}
				await tx.insert(socialAccounts).values(accounts.map((a) => ({ ...a, userId: locals.user.id })));
			});
		} catch (e) {
			if (e.userFacing) return fail(400, { error: e.message });
			if (isUniqueViolation(e)) return fail(400, { error: 'Akun tersebut sudah terdaftar' });
			throw e;
		}
		return { success: 'Akun ditambahkan dan menunggu verifikasi admin' };
	},

	// ajukan ganti username akun yang sudah terverifikasi (disetujui admin)
	requestRename: async ({ request, locals }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const username = normalizeUsername(String(form.get('username') ?? ''));
		const note = String(form.get('note') ?? '').trim().slice(0, 500);
		const [a] = await db.select().from(socialAccounts).where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, locals.user.id)));
		if (!a || a.status !== 'approved') return fail(400, { error: 'Hanya akun yang sudah terverifikasi yang bisa diganti username-nya' });
		if (!/^[a-z0-9._-]{1,100}$/.test(username)) return fail(400, { error: 'Username tidak valid (huruf kecil, angka, titik, garis bawah, atau strip)' });
		if (username === a.username) return fail(400, { error: 'Username baru sama dengan yang sekarang' });
		if (note.length < 5) return fail(400, { error: 'Jelaskan alasannya (minimal 5 karakter)' });
		const limit = checkLimits([[`account-rename:${locals.user.id}`, 5, 60 * 60 * 1000]]);
		if (!limit.ok) return fail(429, { error: `Terlalu banyak pengajuan. Coba lagi dalam ${waitText(limit.retryAfter)}.` });
		if (await usernameTaken(db, a.platform, username, a.id)) return fail(400, { error: `${PLATFORMS[a.platform].label} @${username} sudah dipakai akun lain` });
		await db.update(socialAccounts).set({ pendingUsername: username, renameNote: note, renameRequestedAt: new Date() }).where(eq(socialAccounts.id, a.id));
		return { success: `Pengajuan ganti username ke @${username} dikirim. Menunggu persetujuan admin.` };
	},

	cancelRename: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const [row] = await db
			.update(socialAccounts)
			.set({ pendingUsername: null, renameNote: null, renameRequestedAt: null })
			.where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, locals.user.id)))
			.returning({ id: socialAccounts.id });
		if (!row) return fail(400, { error: 'Pengajuan tidak ditemukan' });
		return { success: 'Pengajuan ganti username dibatalkan' };
	},

	remove: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		// akun yang sudah disetujui tidak bisa dihapus user karena memiliki riwayat rekap
		const [row] = await db
			.delete(socialAccounts)
			.where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, locals.user.id), ne(socialAccounts.status, 'approved')))
			.returning();
		if (!row) return fail(400, { error: 'Akun tidak bisa dihapus' });
		return { success: 'Pengajuan akun dihapus' };
	}
};

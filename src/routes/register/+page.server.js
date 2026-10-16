import { fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users, socialAccounts } from '#lib/server/db/schema.js';
import { parseAccounts, findTaken, takenMessage, isUniqueViolation } from '#lib/server/accounts.js';
import { EWALLETS } from '#lib/constants.js';
import { checkAndStore } from '#lib/server/ewallet-check.js';

export async function load({ locals }) {
	const u = locals.user;
	const accounts = await db
		.select()
		.from(socialAccounts)
		.where(and(eq(socialAccounts.userId, u.id), ne(socialAccounts.status, 'approved')));
	return {
		me: {
			email: u.email,
			googleName: u.googleName,
			avatarUrl: u.avatarUrl,
			nickname: u.nickname,
			ewalletProvider: u.ewalletProvider,
			ewalletNumber: u.ewalletNumber,
			status: u.status,
			statusNote: u.statusNote
		},
		accounts: accounts.map((a) => ({ platform: a.platform, username: a.username }))
	};
}

export const actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const nickname = String(form.get('nickname') ?? '').trim();
		const ewalletProvider = String(form.get('ewalletProvider') ?? '');
		const ewalletNumber = String(form.get('ewalletNumber') ?? '').replace(/[\s-]/g, '');
		const ewalletConfirm = String(form.get('ewalletConfirm') ?? '').replace(/[\s-]/g, '');
		const values = { nickname, ewalletProvider, ewalletNumber };

		if (nickname.length < 2 || nickname.length > 50) return fail(400, { error: 'Nama panggilan 2–50 karakter', values });
		if (!EWALLETS.includes(ewalletProvider)) return fail(400, { error: 'Pilih penyedia e-wallet', values });
		if (!/^(\+62|62|0)8\d{7,12}$/.test(ewalletNumber))
			return fail(400, { error: 'Nomor e-wallet tidak valid (contoh: 081234567890)', values });
		if (ewalletConfirm !== ewalletNumber) return fail(400, { error: 'Ulangi nomor e-wallet tidak sama dengan nomor e-wallet', values });

		const { accounts, error } = parseAccounts(form);
		if (error) return fail(400, { error, values });
		if (!accounts.length) return fail(400, { error: 'Daftarkan minimal 1 akun media sosial', values });

		try {
			await db.transaction(async (tx) => {
				// buang pengajuan lama yang belum disetujui (kasus daftar ulang setelah ditolak)
				await tx
					.delete(socialAccounts)
					.where(and(eq(socialAccounts.userId, locals.user.id), ne(socialAccounts.status, 'approved')));

				const taken = await findTaken(tx, accounts);
				if (taken.length) throw Object.assign(new Error(takenMessage(taken)), { userFacing: true });

				await tx.insert(socialAccounts).values(accounts.map((a) => ({ ...a, userId: locals.user.id })));
				await tx
					.update(users)
					.set({ ...values, status: 'pending', statusNote: null, registeredAt: new Date() })
					.where(eq(users.id, locals.user.id));
			});
		} catch (e) {
			if (e.userFacing) return fail(400, { error: e.message, values });
			if (isUniqueViolation(e)) return fail(400, { error: 'Salah satu akun baru saja didaftarkan orang lain', values });
			throw e;
		}

		// cek nama pemilik e-wallet di latar belakang (tidak menahan pendaftaran bila mesin cek mati)
		checkAndStore({ ...locals.user, ...values });
		redirect(303, '/pending');
	}
};

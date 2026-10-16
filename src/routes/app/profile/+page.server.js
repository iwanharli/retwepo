import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { EWALLETS } from '#lib/constants.js';
import { checkAndStore } from '#lib/server/ewallet-check.js';

export async function load({ locals }) {
	const { email, nickname, avatarUrl, role, ewalletProvider, ewalletNumber, registeredAt, reviewedAt } = locals.user;
	const [summary] = await db.execute(sql`
		SELECT (SELECT count(*) FROM active_recaps WHERE user_id = ${locals.user.id})::int AS recaps,
			(SELECT count(*) FROM social_accounts WHERE user_id = ${locals.user.id} AND status = 'approved')::int AS accounts`);
	return { profile: { email, nickname, avatarUrl, role, ewalletProvider, ewalletNumber, registeredAt, reviewedAt }, summary };
}

export const actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const nickname = String(form.get('nickname') ?? '').trim();
		const ewalletProvider = String(form.get('ewalletProvider') ?? '');
		const ewalletNumber = String(form.get('ewalletNumber') ?? '').replace(/[\s-]/g, '');
		const ewalletConfirm = String(form.get('ewalletConfirm') ?? '').replace(/[\s-]/g, '');

		if (nickname.length < 2 || nickname.length > 50) return fail(400, { error: 'Nama panggilan 2–50 karakter' });
		if (!EWALLETS.includes(ewalletProvider)) return fail(400, { error: 'Pilih penyedia e-wallet' });
		if (!/^(\+62|62|0)8\d{7,12}$/.test(ewalletNumber)) return fail(400, { error: 'Nomor e-wallet tidak valid' });

		// perubahan e-wallet harus dikonfirmasi dengan mengetik ulang nomor baru
		const changed = ewalletNumber !== locals.user.ewalletNumber || ewalletProvider !== locals.user.ewalletProvider;
		if (changed && ewalletConfirm !== ewalletNumber) return fail(400, { error: 'Konfirmasi nomor e-wallet tidak cocok' });

		await db.update(users).set({ nickname, ewalletProvider, ewalletNumber }).where(eq(users.id, locals.user.id));
		if (changed) checkAndStore({ ...locals.user, ewalletProvider, ewalletNumber });
		return { success: changed ? 'Profil & e-wallet baru disimpan' : 'Profil disimpan' };
	}
};

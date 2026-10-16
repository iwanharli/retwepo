import { fail } from '@sveltejs/kit';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { socialAccounts } from '#lib/server/db/schema.js';
import { parseAccounts, findTaken, takenMessage, isUniqueViolation } from '#lib/server/accounts.js';
import { checkLimits, waitText } from '#lib/server/ratelimit.js';

export async function load({ locals }) {
	const accounts = await db.execute(sql`
		SELECT a.*, count(r.id)::int AS recaps, max(r.posted_at) AS last_at
		FROM social_accounts a LEFT JOIN active_recaps r ON r.social_account_id = a.id
		WHERE a.user_id = ${locals.user.id}
		GROUP BY a.id ORDER BY a.created_at`);
	return { accounts: [...accounts] };
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

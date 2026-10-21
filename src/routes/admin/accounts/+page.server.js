import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { listAccounts } from '#lib/server/social.js';
import { accountActions } from '#lib/server/admin-actions.js';

// Antrian pengajuan akun sosmed tambahan dari user terverifikasi.
// Akun yang diajukan saat pendaftaran ditinjau bersama user-nya di halaman Pendaftaran User.
// ?status=rename → pengajuan ganti username dari user.
export async function load({ url }) {
	const isRename = url.searchParams.get('status') === 'rename';
	const [list, renames] = await Promise.all([
		listAccounts(url, { statuses: ['pending', 'rejected'], defaultStatus: 'pending', defaultSort: { key: 'created', dir: 'asc' }, verifiedUsersOnly: true }),
		db.execute(sql`
			SELECT a.id, a.platform, a.username, a.pending_username, a.rename_note, a.rename_requested_at,
				u.id AS user_id, u.nickname, u.email, u.status AS user_status,
				(SELECT count(*)::int FROM active_recaps r WHERE r.social_account_id = a.id) AS recaps
			FROM social_accounts a JOIN users u ON u.id = a.user_id
			WHERE a.pending_username IS NOT NULL
			ORDER BY a.rename_requested_at`)
	]);
	return { ...list, f: { ...list.f, status: isRename ? 'rename' : list.f.status }, counts: { ...list.counts, rename: renames.length }, renames: [...renames] };
}

export const actions = accountActions;

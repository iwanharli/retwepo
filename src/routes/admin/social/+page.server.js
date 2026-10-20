import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { listAccountsByUser } from '#lib/server/social.js';
import { accountActions } from '#lib/server/admin-actions.js';
import { parsePlatforms } from '#lib/constants.js';
import { platformCond } from '#lib/server/filters.js';

// ?owner= status pemilik akun: approved (default) | suspended | all
const OWNERS = ['approved', 'suspended', 'all'];

// Akun sosmed yang sudah diverifikasi
export async function load({ url }) {
	const owner = OWNERS.includes(url.searchParams.get('owner')) ? url.searchParams.get('owner') : 'approved';
	const platforms = parsePlatforms(url.searchParams);
	const [list, ownerCounts] = await Promise.all([
		listAccountsByUser(url, { ownerStatus: owner === 'all' ? null : owner }),
		db.execute(sql`
			SELECT u.status, count(DISTINCT u.id)::int AS n FROM social_accounts a JOIN users u ON u.id = a.user_id
			WHERE a.status = 'approved' ${platformCond(platforms)}
			GROUP BY u.status`)
	]);
	const counts = Object.fromEntries([...ownerCounts].map((c) => [c.status, c.n]));
	return { ...list, owner, ownerCounts: { approved: counts.approved ?? 0, suspended: counts.suspended ?? 0, all: Object.values(counts).reduce((a, b) => a + b, 0) } };
}

export const actions = accountActions;

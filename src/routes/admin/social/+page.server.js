import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { listAccountsByUser } from '#lib/server/social.js';
import { accountActions } from '#lib/server/admin-actions.js';
import { PLATFORMS } from '#lib/constants.js';

// ?owner= status pemilik akun: approved (default) | suspended | all
const OWNERS = ['approved', 'suspended', 'all'];

// Akun sosmed yang sudah diverifikasi
export async function load({ url }) {
	const owner = OWNERS.includes(url.searchParams.get('owner')) ? url.searchParams.get('owner') : 'approved';
	const platform = PLATFORMS[url.searchParams.get('platform')] ? url.searchParams.get('platform') : null;
	const [list, ownerCounts] = await Promise.all([
		listAccountsByUser(url, { ownerStatus: owner === 'all' ? null : owner }),
		db.execute(sql`
			SELECT u.status, count(DISTINCT u.id)::int AS n FROM social_accounts a JOIN users u ON u.id = a.user_id
			WHERE a.status = 'approved' AND (${platform}::text IS NULL OR a.platform::text = ${platform})
			GROUP BY u.status`)
	]);
	const counts = Object.fromEntries([...ownerCounts].map((c) => [c.status, c.n]));
	return { ...list, owner, ownerCounts: { approved: counts.approved ?? 0, suspended: counts.suspended ?? 0, all: Object.values(counts).reduce((a, b) => a + b, 0) } };
}

export const actions = accountActions;

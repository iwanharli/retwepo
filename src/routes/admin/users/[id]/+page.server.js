import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { parseRange } from '#lib/server/dates.js';
import { userStats } from '#lib/server/stats.js';
import { recapFilters, listRecaps, pageNum } from '#lib/server/recaps.js';
import { userActions, accountActions } from '#lib/server/admin-actions.js';

export async function load({ params, url, locals }) {
	const id = Number(params.id);
	const [u] = await db.select().from(users).where(eq(users.id, id));
	if (!u) error(404, 'User tidak ditemukan');

	const range = parseRange(url);
	const { where } = recapFilters(new URL('http://x/'), { userId: id });
	const [stats, recent] = await Promise.all([userStats(id, range), listRecaps(where, pageNum(url), 12)]);

	let reviewer = null;
	if (u.reviewedBy) [reviewer] = await db.select({ nickname: users.nickname }).from(users).where(eq(users.id, u.reviewedBy));

	return {
		u: { ...u, googleId: undefined },
		meId: locals.user.id,
		reviewer: reviewer?.nickname ?? null,
		range: { from: range.from, to: range.to, days: range.days },
		stats,
		recent
	};
}

export const actions = { ...userActions, ...accountActions };

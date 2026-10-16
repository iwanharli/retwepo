import { error } from '@sveltejs/kit';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recaps } from '#lib/server/db/schema.js';
import { parseRange, dayList } from '#lib/server/dates.js';
import { listRecaps, pageNum } from '#lib/server/recaps.js';
import { accountActions } from '#lib/server/admin-actions.js';
import { TZ } from '#lib/constants.js';

export async function load({ params, url }) {
	const id = Number(params.id) || 0;
	const [account] = await db.execute(sql`
		SELECT a.*, u.id AS owner_id, u.nickname AS owner_nickname, u.email AS owner_email, u.avatar_url AS owner_avatar,
			u.status AS owner_status, r.nickname AS reviewer
		FROM social_accounts a
		JOIN users u ON u.id = a.user_id
		LEFT JOIN users r ON r.id = a.reviewed_by
		WHERE a.id = ${id}`);
	if (!account) error(404, 'Akun tidak ditemukan');

	const range = parseRange(url);
	const [start, end] = [range.start.toISOString(), range.end.toISOString()];

	const [summary, daily, history, recent] = await Promise.all([
		db.execute(sql`
			SELECT count(*)::int AS total,
				count(*) FILTER (WHERE posted_at >= ${start} AND posted_at < ${end})::int AS in_range,
				count(*) FILTER (WHERE type = 'post' AND posted_at >= ${start} AND posted_at < ${end})::int AS posts,
				count(*) FILTER (WHERE type = 'reply' AND posted_at >= ${start} AND posted_at < ${end})::int AS replies,
				count(DISTINCT (posted_at AT TIME ZONE ${TZ})::date) FILTER (WHERE posted_at >= ${start} AND posted_at < ${end})::int AS active_days,
				min(posted_at) AS first_at, max(posted_at) AS last_at,
				(SELECT count(*)::int FROM recaps d WHERE d.social_account_id = ${id} AND d.deleted_at IS NOT NULL) AS deleted
			FROM active_recaps WHERE social_account_id = ${id}`).then((r) => r[0]),
		db.execute(sql`
			SELECT to_char(posted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, type, count(*)::int AS n
			FROM active_recaps WHERE social_account_id = ${id} AND posted_at >= ${start} AND posted_at < ${end}
			GROUP BY 1, 2`),
		// riwayat verifikasi dari log aktivitas admin
		db.execute(sql`
			SELECT l.id, l.action, l.note, l.created_at, a.nickname AS admin_nickname, a.email AS admin_email
			FROM admin_logs l LEFT JOIN users a ON a.id = l.admin_id
			WHERE l.target_type = 'account' AND l.target_id = ${id}
			ORDER BY l.created_at DESC LIMIT 20`),
		listRecaps(and(isNull(recaps.deletedAt), eq(recaps.socialAccountId, id)), pageNum(url), 12)
	]);

	const days = dayList(range.from, range.to);
	const series = { post: days.map(() => 0), reply: days.map(() => 0) };
	for (const r of daily) {
		const i = days.indexOf(r.day);
		if (i >= 0) series[r.type][i] = r.n;
	}

	return {
		account,
		summary,
		days,
		series,
		history: [...history],
		recent,
		range: { from: range.from, to: range.to, days: range.days }
	};
}

export const actions = accountActions;

import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { TZ } from '#lib/constants.js';
import { dayList } from './dates.js';

const rows = async (q) => [...(await db.execute(q))];
const one = async (q) => (await db.execute(q))[0];

/** Filter platform opsional (pakai alias "a" untuk social_accounts) */
const pf = (platform) => (platform ? sql`AND a.platform = ${platform}` : sql``);

/** Parameter Date harus dikirim sebagai string ke query mentah */
const iso = (d) => d.toISOString();

export async function adminStats(range) {
	const { from, to, platform } = range;
	const [start, end, prevStart, prevEnd] = [range.start, range.end, range.prevStart, range.prevEnd].map(iso);
	const P = pf(platform);

	const kpiQuery = (s, e) => sql`
		SELECT count(*)::int AS total,
			count(*) FILTER (WHERE r.type = 'post')::int AS posts,
			count(*) FILTER (WHERE r.type = 'reply')::int AS replies,
			count(DISTINCT r.user_id)::int AS active_users,
			count(DISTINCT r.social_account_id)::int AS active_accounts,
			count(*) FILTER (WHERE r.screenshot_path IS NOT NULL)::int AS with_shot,
			count(*) FILTER (WHERE r.url IS NOT NULL)::int AS with_url
		FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id
		WHERE r.posted_at >= ${s} AND r.posted_at < ${e} ${P}`;

	const [kpi, prev, totals, daily, byPlatform, heat, topUsers, topAccounts, growth, buckets, inactive] =
		await Promise.all([
			one(kpiQuery(start, end)),
			one(kpiQuery(prevStart, prevEnd)),
			one(sql`
				SELECT
					(SELECT count(*) FROM users WHERE status = 'approved')::int AS approved_users,
					(SELECT count(*) FROM users WHERE status = 'pending')::int AS pending_users,
					(SELECT count(*) FROM social_accounts WHERE status = 'approved')::int AS approved_accounts,
					(SELECT count(*) FROM social_accounts WHERE status = 'pending')::int AS pending_accounts,
					(SELECT count(*) FROM users WHERE registered_at >= ${start} AND registered_at < ${end})::int AS new_users,
					(SELECT count(*) FROM active_recaps)::int AS all_recaps`),

			rows(sql`
				SELECT to_char(r.posted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, a.platform, r.type, count(*)::int AS n
				FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id
				WHERE r.posted_at >= ${start} AND r.posted_at < ${end} ${P}
				GROUP BY 1, 2, 3`),

			rows(sql`
				SELECT a.platform, r.type, count(*)::int AS n
				FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id
				WHERE r.posted_at >= ${start} AND r.posted_at < ${end} ${P}
				GROUP BY 1, 2`),

			rows(sql`
				SELECT extract(isodow FROM r.posted_at AT TIME ZONE ${TZ})::int AS dow,
					extract(hour FROM r.posted_at AT TIME ZONE ${TZ})::int AS hour, count(*)::int AS n
				FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id
				WHERE r.posted_at >= ${start} AND r.posted_at < ${end} ${P}
				GROUP BY 1, 2`),

			rows(sql`
				SELECT u.id, u.nickname, u.email, u.avatar_url,
					count(*)::int AS total,
					count(*) FILTER (WHERE r.type = 'post')::int AS posts,
					count(*) FILTER (WHERE r.type = 'reply')::int AS replies,
					count(DISTINCT (r.posted_at AT TIME ZONE ${TZ})::date)::int AS active_days
				FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id JOIN users u ON u.id = r.user_id
				WHERE r.posted_at >= ${start} AND r.posted_at < ${end} ${P}
				GROUP BY u.id ORDER BY total DESC LIMIT 10`),

			rows(sql`
				SELECT a.id, a.platform, a.username, u.id AS user_id, u.nickname, u.email, u.avatar_url, u.status AS user_status,
					count(*)::int AS total,
					count(*) FILTER (WHERE r.type = 'post')::int AS posts,
					count(*) FILTER (WHERE r.type = 'reply')::int AS replies
				FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id JOIN users u ON u.id = a.user_id
				WHERE r.posted_at >= ${start} AND r.posted_at < ${end} ${P}
				GROUP BY a.id, u.id ORDER BY total DESC LIMIT 10`),

			rows(sql`
				SELECT to_char(date_trunc('week', registered_at AT TIME ZONE ${TZ}), 'YYYY-MM-DD') AS week, count(*)::int AS n
				FROM users WHERE registered_at IS NOT NULL AND registered_at >= now() - interval '12 weeks'
				GROUP BY 1 ORDER BY 1`),

			// sebaran user disetujui berdasarkan jumlah rekap di periode ini
			rows(sql`
				WITH c AS (
					SELECT u.id, count(r.id) AS n
					FROM users u
					LEFT JOIN active_recaps r ON r.user_id = u.id AND r.posted_at >= ${start} AND r.posted_at < ${end}
						AND (${platform}::text IS NULL OR EXISTS (SELECT 1 FROM social_accounts a WHERE a.id = r.social_account_id AND a.platform::text = ${platform}))
					WHERE u.status = 'approved'
					GROUP BY u.id
				)
				SELECT CASE WHEN n = 0 THEN '0' WHEN n <= 5 THEN '1–5' WHEN n <= 20 THEN '6–20'
					WHEN n <= 50 THEN '21–50' WHEN n <= 100 THEN '51–100' ELSE '100+' END AS bucket,
					count(*)::int AS users
				FROM c GROUP BY 1`),

			// user disetujui yang tidak membuat rekap 7 hari terakhir
			rows(sql`
				SELECT u.id, u.nickname, u.email, u.avatar_url, u.reviewed_at, max(r.posted_at) AS last_at, count(r.id)::int AS total
				FROM users u LEFT JOIN active_recaps r ON r.user_id = u.id
				WHERE u.status = 'approved' AND u.role = 'user'
				GROUP BY u.id
				HAVING max(r.posted_at) IS NULL OR max(r.posted_at) < now() - interval '7 days'
				ORDER BY max(r.posted_at) ASC NULLS FIRST, u.reviewed_at ASC LIMIT 6`)
		]);

	const [{ inactive_count }] = await db.execute(sql`
		SELECT count(*)::int AS inactive_count FROM users u
		WHERE u.status = 'approved' AND u.role = 'user' AND NOT EXISTS (
			SELECT 1 FROM active_recaps r WHERE r.user_id = u.id AND r.posted_at >= now() - interval '7 days')`);

	// susun deret harian per platform & per tipe
	const days = dayList(from, to);
	const idx = new Map(days.map((d, i) => [d, i]));
	const dailyPlatform = {};
	const dailyType = { post: days.map(() => 0), reply: days.map(() => 0) };
	for (const r of daily) {
		dailyPlatform[r.platform] ??= days.map(() => 0);
		const i = idx.get(r.day);
		if (i === undefined) continue;
		dailyPlatform[r.platform][i] += r.n;
		dailyType[r.type][i] += r.n;
	}

	const BUCKETS = ['0', '1–5', '6–20', '21–50', '51–100', '100+'];
	const bucketMap = Object.fromEntries(buckets.map((b) => [b.bucket, b.users]));

	return {
		kpi,
		prev,
		totals: { ...totals, inactive_users: inactive_count },
		days,
		dailyPlatform,
		dailyType,
		byPlatform,
		heat,
		topUsers,
		topAccounts,
		growth,
		buckets: BUCKETS.map((b) => ({ bucket: b, users: bucketMap[b] ?? 0 })),
		inactive
	};
}

/** Statistik satu user (halaman detail admin) */
export async function userStats(userId, range) {
	const { from, to } = range;
	const [start, end] = [iso(range.start), iso(range.end)];
	const [daily, perAccount, summary] = await Promise.all([
		rows(sql`
			SELECT to_char(posted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, type, count(*)::int AS n
			FROM active_recaps WHERE user_id = ${userId} AND posted_at >= ${start} AND posted_at < ${end}
			GROUP BY 1, 2`),
		rows(sql`
			SELECT a.id, a.platform, a.username, a.status, a.status_note, a.created_at,
				count(r.id)::int AS total,
				count(r.id) FILTER (WHERE r.posted_at >= ${start} AND r.posted_at < ${end})::int AS in_range,
				max(r.posted_at) AS last_at
			FROM social_accounts a LEFT JOIN active_recaps r ON r.social_account_id = a.id
			WHERE a.user_id = ${userId} GROUP BY a.id ORDER BY a.created_at`),
		one(sql`
			SELECT count(*)::int AS total,
				count(*) FILTER (WHERE posted_at >= ${start} AND posted_at < ${end})::int AS in_range,
				count(*) FILTER (WHERE type = 'post' AND posted_at >= ${start} AND posted_at < ${end})::int AS posts,
				count(*) FILTER (WHERE type = 'reply' AND posted_at >= ${start} AND posted_at < ${end})::int AS replies,
				count(DISTINCT (posted_at AT TIME ZONE ${TZ})::date) FILTER (WHERE posted_at >= ${start} AND posted_at < ${end})::int AS active_days,
				min(posted_at) AS first_at, max(posted_at) AS last_at
			FROM active_recaps WHERE user_id = ${userId}`)
	]);

	const days = dayList(from, to);
	const series = { post: days.map(() => 0), reply: days.map(() => 0) };
	for (const r of daily) {
		const i = days.indexOf(r.day);
		if (i >= 0) series[r.type][i] = r.n;
	}
	return { days, series, perAccount, summary };
}

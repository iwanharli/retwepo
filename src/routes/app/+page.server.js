import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { ymd, addDays, startOfDay, dayList } from '#lib/server/dates.js';
import { TZ } from '#lib/constants.js';
import { missingProfile } from '#lib/server/profile.js';

const iso = (d) => d.toISOString();

export async function load({ locals }) {
	const uid = locals.user.id;
	const today = ymd();
	const t0 = iso(startOfDay(today));
	const w0 = iso(startOfDay(addDays(today, -6)));
	const m0 = iso(startOfDay(addDays(today, -29)));
	const p0 = iso(startOfDay(addDays(today, -59)));

	const [counts] = await db.execute(sql`
		SELECT
			count(*) FILTER (WHERE posted_at >= ${t0})::int AS today,
			count(*) FILTER (WHERE posted_at >= ${w0})::int AS week,
			count(*) FILTER (WHERE posted_at >= ${m0})::int AS month,
			count(*) FILTER (WHERE posted_at >= ${p0} AND posted_at < ${m0})::int AS prev_month,
			count(*)::int AS total,
			count(*) FILTER (WHERE type = 'post')::int AS posts,
			count(*) FILTER (WHERE type = 'reply')::int AS replies,
			count(DISTINCT (posted_at AT TIME ZONE ${TZ})::date) FILTER (WHERE posted_at >= ${m0})::int AS active_days,
			max(posted_at) AS last_at
		FROM active_recaps WHERE user_id = ${uid}`);

	const daily = await db.execute(sql`
		SELECT to_char(posted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, type, count(*)::int AS n
		FROM active_recaps WHERE user_id = ${uid} AND posted_at >= ${m0}
		GROUP BY 1, 2`);

	const perAccount = await db.execute(sql`
		SELECT a.id, a.platform, a.username, a.status,
			count(r.id)::int AS total,
			count(r.id) FILTER (WHERE r.posted_at >= ${m0})::int AS month,
			max(r.posted_at) AS last_at
		FROM social_accounts a
		LEFT JOIN active_recaps r ON r.social_account_id = a.id
		WHERE a.user_id = ${uid}
		GROUP BY a.id ORDER BY total DESC`);

	const recent = await db.execute(sql`
		SELECT r.id, r.type, r.url, r.screenshot_path, r.note, r.posted_at, a.platform, a.username
		FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id
		WHERE r.user_id = ${uid} ORDER BY r.posted_at DESC, r.id DESC LIMIT 8`);

	const days = dayList(addDays(today, -29), today);
	const series = { post: days.map(() => 0), reply: days.map(() => 0) };
	for (const row of daily) series[row.type][days.indexOf(row.day)] = row.n;

	const [{ deleted_recent }] = await db.execute(sql`
		SELECT count(*)::int AS deleted_recent FROM recaps
		WHERE user_id = ${uid} AND deleted_at >= now() - interval '30 days'`);

	return { deletedRecent: deleted_recent, counts, days, series, perAccount: [...perAccount], recent: [...recent], missingProfile: missingProfile(locals.user) };
}

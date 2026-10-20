import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { ymd, addDays, startOfDay, dayList, parseRange } from '#lib/server/dates.js';
import { TZ, PLATFORMS } from '#lib/constants.js';
import { listCampaigns } from '#lib/server/campaigns.js';
import { missingProfile } from '#lib/server/profile.js';

const iso = (d) => d.toISOString();

export async function load({ locals, url }) {
	const uid = locals.user.id;
	const today = ymd();
	const t0 = iso(startOfDay(today));
	const y0 = iso(startOfDay(addDays(today, -1)));

	// filter: rentang tanggal (default 30 hari), kampanye & platform
	const range = parseRange(url);
	const [start, end, prevStart, prevEnd] = [range.start, range.end, range.prevStart, range.prevEnd].map(iso);
	const campaigns = await listCampaigns();
	const campaign = campaigns.find((c) => c.id === Number(url.searchParams.get('campaign')))?.id ?? null;
	const platform = PLATFORMS[url.searchParams.get('platform')] ? url.searchParams.get('platform') : null;
	// kondisi untuk rekap alias r (butuh join social_accounts a)
	const F = sql`${campaign ? sql`AND r.campaign_id = ${campaign}` : sql``} ${platform ? sql`AND a.platform = ${platform}` : sql``}`;
	const FROM = sql`FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id WHERE r.user_id = ${uid} ${F}`;

	const [counts] = await db.execute(sql`
		SELECT
			count(*) FILTER (WHERE r.posted_at >= ${t0})::int AS today,
			count(*) FILTER (WHERE r.posted_at >= ${y0} AND r.posted_at < ${t0})::int AS yesterday,
			count(*) FILTER (WHERE r.posted_at >= ${start} AND r.posted_at < ${end})::int AS period,
			count(*) FILTER (WHERE r.posted_at >= ${prevStart} AND r.posted_at < ${prevEnd})::int AS prev_period,
			count(*) FILTER (WHERE r.posted_at >= ${start} AND r.posted_at < ${end} AND r.type = 'post')::int AS period_posts,
			count(*) FILTER (WHERE r.posted_at >= ${start} AND r.posted_at < ${end} AND r.type = 'reply')::int AS period_replies,
			count(DISTINCT (r.posted_at AT TIME ZONE ${TZ})::date) FILTER (WHERE r.posted_at >= ${start} AND r.posted_at < ${end})::int AS active_days,
			count(*)::int AS total,
			count(*) FILTER (WHERE r.type = 'post')::int AS posts,
			count(*) FILTER (WHERE r.type = 'reply')::int AS replies,
			max(r.posted_at) AS last_at
		${FROM}`);

	const daily = await db.execute(sql`
		SELECT to_char(r.posted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, r.type, count(*)::int AS n
		${FROM} AND r.posted_at >= ${start} AND r.posted_at < ${end}
		GROUP BY 1, 2`);

	// 7 hari terakhir untuk grafik kecil di kartu "Hari ini" (tidak ikut rentang tanggal)
	const week = await db.execute(sql`
		SELECT to_char(r.posted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, count(*)::int AS n
		${FROM} AND r.posted_at >= ${iso(startOfDay(addDays(today, -6)))}
		GROUP BY 1`);
	const weekDays = dayList(addDays(today, -6), today);
	const last7 = weekDays.map((d) => [...week].find((w) => w.day === d)?.n ?? 0);

	const perAccount = await db.execute(sql`
		SELECT a.id, a.platform, a.username, a.status,
			count(r.id)::int AS total,
			count(r.id) FILTER (WHERE r.posted_at >= ${start} AND r.posted_at < ${end})::int AS period,
			max(r.posted_at) AS last_at
		FROM social_accounts a
		LEFT JOIN active_recaps r ON r.social_account_id = a.id ${campaign ? sql`AND r.campaign_id = ${campaign}` : sql``}
		WHERE a.user_id = ${uid} ${platform ? sql`AND a.platform = ${platform}` : sql``}
		GROUP BY a.id ORDER BY period DESC, total DESC`);

	const recent = await db.execute(sql`
		SELECT r.id, r.type, r.url, r.screenshot_path, r.note, r.posted_at, a.platform, a.username, c.name AS campaign
		FROM active_recaps r JOIN social_accounts a ON a.id = r.social_account_id JOIN campaigns c ON c.id = r.campaign_id
		WHERE r.user_id = ${uid} ${F} ORDER BY r.posted_at DESC, r.id DESC LIMIT 8`);

	const days = dayList(range.from, range.to);
	const series = { post: days.map(() => 0), reply: days.map(() => 0) };
	for (const row of daily) {
		const i = days.indexOf(row.day);
		if (i >= 0) series[row.type][i] = row.n;
	}

	const [{ deleted_recent }] = await db.execute(sql`
		SELECT count(*)::int AS deleted_recent FROM recaps
		WHERE user_id = ${uid} AND deleted_at >= now() - interval '30 days'`);

	return {
		deletedRecent: deleted_recent,
		counts,
		last7,
		range: { from: range.from, to: range.to, days: range.days },
		campaign,
		campaigns,
		platform,
		days,
		series, perAccount: [...perAccount], recent: [...recent], missingProfile: missingProfile(locals.user) };
}

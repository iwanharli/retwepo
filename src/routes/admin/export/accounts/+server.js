import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { csvResponse } from '#lib/server/csv.js';
import { exportParams, wib, campaignTag } from '#lib/server/export-common.js';
import { ACCOUNT_EXPORT_COLUMNS, ACCOUNT_STATUS, USER_STATUS, PLATFORMS } from '#lib/constants.js';

/**
 * Export akun sosmed ke CSV.
 * status=<status> (berulang), platform=, owner=verified (hanya pemilik terverifikasi), from/to = rentang untuk menghitung rekap, col=, sep=, q=
 */
export async function GET({ url }) {
	const o = exportParams(url, ACCOUNT_EXPORT_COLUMNS, Object.keys(ACCOUNT_STATUS));
	const platform = PLATFORMS[o.platform] ? o.platform : null;
	const verifiedOwners = url.searchParams.get('owner') === 'verified';
	const like = `%${o.q.replace(/[%_\\]/g, '\\$&')}%`;
	const inStatuses = sql.join(o.statuses.map((s) => sql`${s}`), sql`, `);
	const range = sql`(${o.start}::timestamptz IS NULL OR r.posted_at >= ${o.start}::timestamptz) AND (${o.end}::timestamptz IS NULL OR r.posted_at < ${o.end}::timestamptz)
		AND (${o.campaign}::int IS NULL OR r.campaign_id = ${o.campaign}::int)`;

	const rows = await db.execute(sql`
		SELECT a.id, a.platform, a.username, a.status, a.status_note, a.created_at, a.reviewed_at,
			u.nickname, u.email, u.status AS user_status,
			count(r.id)::int AS total,
			count(r.id) FILTER (WHERE r.type = 'post')::int AS posts,
			count(r.id) FILTER (WHERE r.type = 'reply')::int AS replies,
			max(r.posted_at) AS last_at
		FROM social_accounts a
		JOIN users u ON u.id = a.user_id
		LEFT JOIN active_recaps r ON r.social_account_id = a.id AND ${range}
		WHERE a.status::text IN (${inStatuses})
			AND (${platform}::text IS NULL OR a.platform::text = ${platform})
			AND (${verifiedOwners} = false OR u.status = 'approved')
			AND (${o.q} = '' OR a.username ILIKE ${like} OR u.nickname ILIKE ${like} OR u.email ILIKE ${like})
		GROUP BY a.id, u.id
		ORDER BY a.platform, total DESC, lower(a.username)`);

	const DEF = {
		id: [['ID'], (r) => [r.id]],
		platform: [['Platform'], (r) => [PLATFORMS[r.platform].label]],
		username: [['Username'], (r) => [`@${r.username}`]],
		profile_url: [['Link profil'], (r) => [PLATFORMS[r.platform].profile(r.username)]],
		owner: [['Pemilik'], (r) => [r.nickname]],
		owner_email: [['Email pemilik', 'Status pemilik'], (r) => [r.email, USER_STATUS[r.user_status]?.label ?? r.user_status]],
		status: [['Status verifikasi'], (r) => [ACCOUNT_STATUS[r.status]?.label ?? r.status]],
		status_note: [['Alasan ditolak/dicabut'], (r) => [r.status_note]],
		total: [['Jumlah rekap'], (r) => [r.total]],
		posts: [['Postingan'], (r) => [r.posts]],
		replies: [['Panel'], (r) => [r.replies]],
		last_at: [['Rekap terakhir (WIB)'], (r) => [wib(r.last_at)]],
		created_at: [['Diajukan (WIB)'], (r) => [wib(r.created_at)]],
		reviewed_at: [['Ditinjau (WIB)'], (r) => [wib(r.reviewed_at)]]
	};

	const tag = await campaignTag(o.campaign);
	return csvResponse(
		`akun-sosmed${tag}-${o.rangeLabel}.csv`,
		o.cols.flatMap((c) => DEF[c][0]),
		[...rows].map((r) => o.cols.flatMap((c) => DEF[c][1](r))),
		o.sep
	);
}

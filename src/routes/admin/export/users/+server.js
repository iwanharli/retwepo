import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { csvResponse } from '#lib/server/csv.js';
import { exportParams, wib, campaignTag } from '#lib/server/export-common.js';
import { USER_EXPORT_COLUMNS, USER_STATUS, PLATFORMS } from '#lib/constants.js';

const ROLE = { user: 'User', admin: 'Admin' };

/**
 * Export user ke CSV.
 * status=<status> (berulang), from/to = rentang untuk menghitung rekap, col=<kolom> (berulang), sep=comma|semicolon, q=cari
 */
export async function GET({ url }) {
	const o = exportParams(url, USER_EXPORT_COLUMNS, Object.keys(USER_STATUS));
	const like = `%${o.q.replace(/[%_\\]/g, '\\$&')}%`;
	const inStatuses = sql.join(o.statuses.map((s) => sql`${s}`), sql`, `);
	const range = sql`(${o.start}::timestamptz IS NULL OR r.posted_at >= ${o.start}::timestamptz) AND (${o.end}::timestamptz IS NULL OR r.posted_at < ${o.end}::timestamptz)
		AND (${o.campaign}::int IS NULL OR r.campaign_id = ${o.campaign}::int)`;

	const rows = await db.execute(sql`
		SELECT u.id, u.nickname, u.email, u.role, u.status, u.status_note, u.ewallet_provider, u.ewallet_number,
			coalesce(u.registered_at, u.created_at) AS registered_at,
			-- akun aktif & yang masih menunggu (diberi keterangan); akun ditolak tidak dicantumkan
			(SELECT string_agg(s.platform || ':@' || s.username || CASE WHEN s.status = 'pending' THEN ' (menunggu)' ELSE '' END, '; ' ORDER BY s.created_at)
				FROM social_accounts s WHERE s.user_id = u.id AND s.status <> 'rejected') AS accounts,
			count(r.id)::int AS total,
			count(r.id) FILTER (WHERE r.type = 'post')::int AS posts,
			count(r.id) FILTER (WHERE r.type = 'reply')::int AS replies,
			count(DISTINCT (r.posted_at AT TIME ZONE 'Asia/Jakarta')::date)::int AS active_days,
			max(r.posted_at) AS last_at
		FROM users u
		LEFT JOIN active_recaps r ON r.user_id = u.id AND ${range}
		WHERE u.status::text IN (${inStatuses})
			AND (${o.q} = '' OR u.email ILIKE ${like} OR u.nickname ILIKE ${like} OR u.ewallet_number ILIKE ${like})
		GROUP BY u.id
		ORDER BY total DESC, lower(coalesce(u.nickname, u.email))`);

	const accLabel = (s) =>
		(s ?? '')
			.split('; ')
			.filter(Boolean)
			.map((x) => x.replace(/^(\w+):/, (_, p) => `${PLATFORMS[p]?.label ?? p} `))
			.join('; ');

	const DEF = {
		id: [['ID'], (r) => [r.id]],
		nickname: [['Nama panggilan'], (r) => [r.nickname]],
		email: [['Email'], (r) => [r.email]],
		role: [['Peran'], (r) => [ROLE[r.role]]],
		status: [['Status'], (r) => [USER_STATUS[r.status]?.label ?? r.status]],
		ewallet: [['E-wallet', 'Nomor e-wallet'], (r) => [r.ewallet_provider, r.ewallet_number]],
		accounts: [['Akun sosmed'], (r) => [accLabel(r.accounts)]],
		total: [['Jumlah rekap'], (r) => [r.total]],
		posts: [['Postingan'], (r) => [r.posts]],
		replies: [['Panel'], (r) => [r.replies]],
		active_days: [['Hari aktif'], (r) => [r.active_days]],
		last_at: [['Rekap terakhir (WIB)'], (r) => [wib(r.last_at)]],
		registered_at: [['Tanggal daftar (WIB)'], (r) => [wib(r.registered_at)]],
		status_note: [['Catatan status'], (r) => [r.status_note]]
	};

	const tag = await campaignTag(o.campaign);
	return csvResponse(
		`users${tag}-${o.rangeLabel}.csv`,
		o.cols.flatMap((c) => DEF[c][0]),
		[...rows].map((r) => o.cols.flatMap((c) => DEF[c][1](r))),
		o.sep
	);
}

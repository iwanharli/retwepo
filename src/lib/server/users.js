import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { parseSort, orderSql } from './sort.js';

const PER_PAGE = 30;
// kolom yang bisa diurutkan (dir = arah default saat pertama diklik)
export const USER_COLUMNS = {
	name: { expr: sql`lower(coalesce(u.nickname, u.email))`, dir: 'asc' },
	ewallet: { expr: sql`u.ewallet_provider`, dir: 'asc' },
	registered: { expr: sql`coalesce(u.registered_at, u.created_at)`, dir: 'desc' },
	accounts: { expr: sql`(SELECT count(*) FROM social_accounts s WHERE s.user_id = u.id AND s.status = 'approved')`, dir: 'desc' },
	today: { expr: sql`today`, dir: 'desc' },
	week: { expr: sql`week`, dir: 'desc' },
	month: { expr: sql`month`, dir: 'desc' },
	active: { expr: sql`active_days`, dir: 'desc' },
	total: { expr: sql`total`, dir: 'desc' },
	last: { expr: sql`last_at`, dir: 'desc' },
	status: { expr: sql`u.status`, dir: 'asc' }
};

/**
 * Daftar user admin, dibatasi ke `statuses` (mis. antrian pendaftaran vs user terverifikasi).
 * ?status= memilih salah satu tab, ?q= cari, ?sort=&dir= urutan kolom, ?page=
 */
export async function listUsers(url, { statuses, defaultStatus = null, defaultSort = { key: 'registered', dir: 'desc' } }) {
	const p = url.searchParams;
	// ?status=all → semua status dalam `statuses`; tanpa parameter → defaultStatus
	const all = p.get('status') === 'all';
	const status = all ? null : statuses.includes(p.get('status')) ? p.get('status') : defaultStatus;
	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const sort = parseSort(url, USER_COLUMNS, defaultSort);
	const page = Math.max(1, Number(p.get('page')) || 1);
	const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
	const inStatuses = sql.join(statuses.map((s) => sql`${s}`), sql`, `);

	const where = sql`WHERE u.status::text IN (${inStatuses})
		AND (${status}::text IS NULL OR u.status::text = ${status})
		AND (${q} = '' OR u.email ILIKE ${like} OR u.nickname ILIKE ${like} OR u.ewallet_number ILIKE ${like}
			OR EXISTS (SELECT 1 FROM social_accounts s WHERE s.user_id = u.id AND s.username ILIKE ${like}))`;

	const [rows, [{ total }], counts] = await Promise.all([
		db.execute(sql`
			SELECT u.id, u.email, u.nickname, u.avatar_url, u.role, u.status, u.status_note,
				u.ewallet_provider, u.ewallet_number,
				CASE WHEN u.ewallet_check_key = lower(u.ewallet_provider || ':' || u.ewallet_number) THEN u.ewallet_check_status END AS ewallet_check,
				u.ewallet_holder, u.registered_at, u.created_at, u.reviewed_at,
				(SELECT json_agg(json_build_object('platform', s.platform, 'username', s.username, 'status', s.status) ORDER BY s.created_at)
					FROM social_accounts s WHERE s.user_id = u.id) AS accounts,
				coalesce(r.total, 0)::int AS total, coalesce(r.month, 0)::int AS month, r.last_at,
				coalesce(r.today, 0)::int AS today, coalesce(r.week, 0)::int AS week, coalesce(r.active_days, 0)::int AS active_days
			FROM users u
			LEFT JOIN (
				SELECT user_id, count(*) AS total,
					count(*) FILTER (WHERE posted_at >= now() - interval '30 days') AS month,
					-- hari ini (WIB) & 7 hari terakhir; hari aktif = jumlah hari berbeda dengan rekap dalam 30 hari
					count(*) FILTER (WHERE posted_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta') AS today,
					count(*) FILTER (WHERE posted_at >= now() - interval '7 days') AS week,
					count(DISTINCT (posted_at AT TIME ZONE 'Asia/Jakarta')::date) FILTER (WHERE posted_at >= now() - interval '30 days') AS active_days,
					max(posted_at) AS last_at
				FROM active_recaps GROUP BY user_id
			) r ON r.user_id = u.id
			${where}
			ORDER BY ${orderSql(USER_COLUMNS, sort)}, u.id DESC
			LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`),
		db.execute(sql`SELECT count(*)::int AS total FROM users u ${where}`),
		db.execute(sql`SELECT status, count(*)::int AS n FROM users WHERE status::text IN (${inStatuses}) GROUP BY status`)
	]);

	return {
		rows: [...rows],
		total,
		page,
		perPage: PER_PAGE,
		f: { status: all ? 'all' : status, q, sort },
		counts: Object.fromEntries([...counts].map((c) => [c.status, c.n]))
	};
}

import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { PLATFORMS } from '#lib/constants.js';
import { parseSort, orderSql } from './sort.js';

const PER_PAGE = 50;
// kolom yang bisa diurutkan (dir = arah default saat pertama diklik)
export const ACCOUNT_COLUMNS = {
	account: { expr: sql`lower(a.username)`, dir: 'asc' },
	owner: { expr: sql`lower(coalesce(u.nickname, u.email))`, dir: 'asc' },
	created: { expr: sql`a.created_at`, dir: 'desc' },
	approved: { expr: sql`coalesce(a.reviewed_at, a.created_at)`, dir: 'desc' },
	month: { expr: sql`month`, dir: 'desc' },
	total: { expr: sql`total`, dir: 'desc' },
	last: { expr: sql`last_at`, dir: 'desc' }
};

/** Daftar akun sosmed admin, dibatasi ke `statuses` (antrian pengajuan vs akun terverifikasi). */
/**
 * verifiedUsersOnly: hanya akun milik user yang sudah disetujui (akun user baru ditangani di Pendaftaran User)
 * ownerStatus: batasi ke status pemilik tertentu (mis. 'approved' / 'suspended')
 */
export async function listAccounts(url, { statuses, defaultStatus = null, defaultSort = { key: 'created', dir: 'desc' }, verifiedUsersOnly = false, ownerStatus = null }) {
	const p = url.searchParams;
	const status = statuses.includes(p.get('status')) ? p.get('status') : defaultStatus;
	const platform = PLATFORMS[p.get('platform')] ? p.get('platform') : null;
	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const sort = parseSort(url, ACCOUNT_COLUMNS, defaultSort);
	const page = Math.max(1, Number(p.get('page')) || 1);
	const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
	const inStatuses = sql.join(statuses.map((s) => sql`${s}`), sql`, `);
	const userCond = verifiedUsersOnly ? sql`AND u.status = 'approved'` : ownerStatus ? sql`AND u.status::text = ${ownerStatus}` : sql``;

	const where = sql`WHERE a.status::text IN (${inStatuses}) ${userCond}
		AND (${status}::text IS NULL OR a.status::text = ${status})
		AND (${platform}::text IS NULL OR a.platform::text = ${platform})
		AND (${q} = '' OR a.username ILIKE ${like} OR u.nickname ILIKE ${like} OR u.email ILIKE ${like})`;

	const [rows, [{ total }], counts] = await Promise.all([
		db.execute(sql`
			SELECT a.id, a.platform, a.username, a.status, a.status_note, a.created_at, a.reviewed_at,
				u.id AS user_id, u.nickname, u.email, u.status AS user_status,
				coalesce(r.total, 0)::int AS total, coalesce(r.month, 0)::int AS month, r.last_at
			FROM social_accounts a
			JOIN users u ON u.id = a.user_id
			LEFT JOIN (
				SELECT social_account_id, count(*) AS total,
					count(*) FILTER (WHERE posted_at >= now() - interval '30 days') AS month,
					max(posted_at) AS last_at
				FROM active_recaps GROUP BY social_account_id
			) r ON r.social_account_id = a.id
			${where}
			ORDER BY ${orderSql(ACCOUNT_COLUMNS, sort)}, a.id DESC
			LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`),
		db.execute(sql`SELECT count(*)::int AS total FROM social_accounts a JOIN users u ON u.id = a.user_id ${where}`),
		db.execute(sql`SELECT a.status, count(*)::int AS n FROM social_accounts a JOIN users u ON u.id = a.user_id
			WHERE a.status::text IN (${inStatuses}) ${userCond} AND (${platform}::text IS NULL OR a.platform::text = ${platform})
			GROUP BY a.status`)
	]);

	return {
		rows: [...rows],
		total,
		page,
		perPage: PER_PAGE,
		f: { status, platform, q, sort },
		counts: Object.fromEntries([...counts].map((c) => [c.status, c.n]))
	};
}

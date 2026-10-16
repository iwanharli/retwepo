import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { LOG_ACTIONS } from '#lib/server/audit.js';
import { parseRange } from '#lib/server/dates.js';

const PER_PAGE = 50;

export async function load({ url }) {
	const p = url.searchParams;
	const action = LOG_ACTIONS[p.get('action')] ? p.get('action') : null;
	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
	const page = Math.max(1, Number(p.get('page')) || 1);
	const range = parseRange(url, 30);
	const [start, end] = [range.start.toISOString(), range.end.toISOString()];

	const where = sql`WHERE l.created_at >= ${start} AND l.created_at < ${end}
		AND (${action}::text IS NULL OR l.action = ${action})
		AND (${q} = '' OR l.target_label ILIKE ${like} OR l.note ILIKE ${like} OR a.nickname ILIKE ${like} OR a.email ILIKE ${like})`;

	const [rows, [{ total }], counts] = await Promise.all([
		db.execute(sql`
			SELECT l.*, a.nickname AS admin_nickname, a.email AS admin_email, a.avatar_url AS admin_avatar,
				t.status AS target_user_status
			FROM admin_logs l
			LEFT JOIN users a ON a.id = l.admin_id
			LEFT JOIN users t ON l.target_type = 'user' AND t.id = l.target_id
			${where}
			ORDER BY l.created_at DESC, l.id DESC
			LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`),
		db.execute(sql`SELECT count(*)::int AS total FROM admin_logs l LEFT JOIN users a ON a.id = l.admin_id ${where}`),
		db.execute(sql`SELECT action, count(*)::int AS n FROM admin_logs l
			WHERE l.created_at >= ${start} AND l.created_at < ${end} GROUP BY action`)
	]);

	return {
		rows: [...rows],
		total,
		page,
		perPage: PER_PAGE,
		actions: LOG_ACTIONS,
		counts: Object.fromEntries([...counts].map((c) => [c.action, c.n])),
		f: { action, q, from: range.from, to: range.to }
	};
}

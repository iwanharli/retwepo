import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

/**
 * Rekap aktif lain dengan URL yang sama (berdasarkan url_key).
 * Hasil: { count, mine: [{ id, posted_at }], others } — "others" hanya jumlah (privasi user lain)
 */
export async function findDuplicates(key, userId, excludeId = null) {
	if (!key) return { count: 0, mine: [], others: 0 };
	const rows = await db.execute(sql`
		SELECT id, user_id, posted_at FROM active_recaps
		WHERE url_key = ${key} AND (${excludeId}::int IS NULL OR id <> ${excludeId}::int)
		ORDER BY posted_at DESC LIMIT 20`);
	const mine = [...rows].filter((r) => r.user_id === userId).map((r) => ({ id: r.id, posted_at: r.posted_at }));
	return { count: rows.length, mine, others: rows.length - mine.length };
}

import { and, eq, gte, inArray } from 'drizzle-orm';
import { db } from './db/index.js';
import { notifications } from './db/schema.js';

/**
 * Kirim notifikasi ke user.
 * list: satu atau banyak { userId, type, title, body?, link? }
 */
export async function notify(list, tx = db) {
	const rows = (Array.isArray(list) ? list : [list]).filter((n) => n?.userId);
	if (rows.length) await tx.insert(notifications).values(rows);
}

/** Tarik kembali notifikasi yang baru dikirim (dipakai saat admin menekan "Batalkan") */
export async function retractNotifications(userIds, types, sinceMs = 15 * 60 * 1000, tx = db) {
	if (!userIds.length) return;
	await tx
		.delete(notifications)
		.where(
			and(inArray(notifications.userId, userIds), inArray(notifications.type, types), gte(notifications.createdAt, new Date(Date.now() - sinceMs)))
		);
}

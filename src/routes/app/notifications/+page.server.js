import { and, eq, isNull, desc, count } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { notifications } from '#lib/server/db/schema.js';

const PER_PAGE = 30;

export async function load({ locals, url }) {
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const unreadOnly = url.searchParams.get('filter') === 'unread';
	const where = and(eq(notifications.userId, locals.user.id), unreadOnly ? isNull(notifications.readAt) : undefined);
	const [rows, [{ total }]] = await Promise.all([
		db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
		db.select({ total: count() }).from(notifications).where(where)
	]);
	return { rows, total, page, perPage: PER_PAGE, unreadOnly };
}

export const actions = {
	readAll: async ({ locals }) => {
		await db
			.update(notifications)
			.set({ readAt: new Date() })
			.where(and(eq(notifications.userId, locals.user.id), isNull(notifications.readAt)));
		return { success: 'Semua notifikasi ditandai sudah dibaca' };
	}
};

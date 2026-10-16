import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { notifications } from '#lib/server/db/schema.js';

// buka notifikasi: tandai dibaca lalu arahkan ke tautannya
export async function GET({ params, locals }) {
	const [n] = await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(and(eq(notifications.id, Number(params.id) || 0), eq(notifications.userId, locals.user.id)))
		.returning();
	redirect(303, n?.link || '/app/notifications');
}

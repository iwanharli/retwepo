import { redirect } from '@sveltejs/kit';
import { invalidateSession, deleteSessionCookie } from '#lib/server/auth.js';

export async function POST(event) {
	if (event.locals.session) await invalidateSession(event.locals.session.id);
	deleteSessionCookie(event);
	redirect(303, '/login');
}

import { redirect, error } from '@sveltejs/kit';
import { checkLimits, waitText } from '#lib/server/ratelimit.js';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { signIn, homeFor } from '#lib/server/auth.js';

// Login tanpa Google — HANYA aktif di mode development (npm run dev)
export async function POST(event) {
	if (!dev) error(404);
	const limit = checkLimits([[`login:${event.getClientAddress()}`, 20, 10 * 60 * 1000]]);
	if (!limit.ok) error(429, `Terlalu banyak percobaan masuk. Coba lagi dalam ${waitText(limit.retryAfter)}.`);
	const form = await event.request.formData();
	const email = String(form.get('email') ?? '').trim().toLowerCase();
	if (!/^\S+@\S+\.\S+$/.test(email)) redirect(303, '/login?error=email');

	let [user] = await db.select().from(users).where(eq(users.email, email));
	if (!user) [user] = await db.insert(users).values({ email, googleName: email.split('@')[0] }).returning();

	await signIn(event, user.id);
	redirect(303, homeFor(user));
}

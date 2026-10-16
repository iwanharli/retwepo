import { redirect, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { signIn, homeFor } from '#lib/server/auth.js';

// Login tanpa Google — HANYA aktif di mode development (npm run dev)
export async function POST(event) {
	if (!dev) error(404);
	const form = await event.request.formData();
	const email = String(form.get('email') ?? '').trim().toLowerCase();
	if (!/^\S+@\S+\.\S+$/.test(email)) redirect(303, '/login?error=email');

	let [user] = await db.select().from(users).where(eq(users.email, email));
	if (!user) [user] = await db.insert(users).values({ email, googleName: email.split('@')[0] }).returning();

	await signIn(event, user.id);
	redirect(303, homeFor(user));
}

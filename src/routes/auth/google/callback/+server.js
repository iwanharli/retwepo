import { redirect, error } from '@sveltejs/kit';
import { decodeIdToken } from 'arctic';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { getGoogle } from '#lib/server/google.js';
import { signIn, homeFor } from '#lib/server/auth.js';

export async function GET(event) {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('google_oauth_state');
	const codeVerifier = event.cookies.get('google_code_verifier');
	event.cookies.delete('google_oauth_state', { path: '/' });
	event.cookies.delete('google_code_verifier', { path: '/' });

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		redirect(303, '/login?error=state');
	}

	let claims;
	try {
		const tokens = await getGoogle(event.url.origin).validateAuthorizationCode(code, codeVerifier);
		claims = decodeIdToken(tokens.idToken());
	} catch {
		redirect(303, '/login?error=google');
	}

	if (!claims.email || claims.email_verified === false) redirect(303, '/login?error=email');

	const email = String(claims.email).toLowerCase();
	const googleId = String(claims.sub);

	let [user] = await db.select().from(users).where(eq(users.googleId, googleId));
	if (!user) {
		// akun yang di-seed (mis. admin) belum punya google_id: ikat lewat email
		[user] = await db.select().from(users).where(eq(users.email, email));
		if (user) {
			[user] = await db
				.update(users)
				.set({ googleId, googleName: claims.name, avatarUrl: claims.picture })
				.where(eq(users.id, user.id))
				.returning();
		} else {
			[user] = await db
				.insert(users)
				.values({ email, googleId, googleName: claims.name, avatarUrl: claims.picture })
				.returning();
		}
	} else if (user.avatarUrl !== claims.picture) {
		await db.update(users).set({ avatarUrl: claims.picture }).where(eq(users.id, user.id));
	}

	if (!user) error(500);
	await signIn(event, user.id);
	redirect(303, homeFor(user));
}

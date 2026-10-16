import { redirect, error } from '@sveltejs/kit';
import { generateCodeVerifier, generateState } from 'arctic';
import { getGoogle, googleConfigured } from '#lib/server/google.js';

export function GET(event) {
	if (!googleConfigured()) error(500, 'Google OAuth belum dikonfigurasi (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)');

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = getGoogle(event.url.origin).createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
	url.searchParams.set('prompt', 'select_account');

	const opts = { path: '/', httpOnly: true, maxAge: 60 * 10, sameSite: 'lax' };
	event.cookies.set('google_oauth_state', state, opts);
	event.cookies.set('google_code_verifier', codeVerifier, opts);

	redirect(302, url.toString());
}

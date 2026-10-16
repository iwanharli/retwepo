import { redirect, error } from '@sveltejs/kit';
import { checkLimits, waitText } from '#lib/server/ratelimit.js';
import { generateCodeVerifier, generateState } from 'arctic';
import { getGoogle, googleConfigured } from '#lib/server/google.js';

export function GET(event) {
	const limit = checkLimits([[`login:${event.getClientAddress()}`, 20, 10 * 60 * 1000]]);
	if (!limit.ok) error(429, `Terlalu banyak percobaan masuk. Coba lagi dalam ${waitText(limit.retryAfter)}.`);
	if (!googleConfigured()) error(500, 'Google OAuth belum dikonfigurasi (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)');

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = getGoogle(event.url.origin).createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
	url.searchParams.set('prompt', 'select_account');

	const opts = { path: '/', httpOnly: true, maxAge: 60 * 10, sameSite: 'lax' };
	event.cookies.set('google_oauth_state', state, opts);
	event.cookies.set('google_code_verifier', codeVerifier, opts);

	// SvelteKit 3 menolak redirect ke domain luar kecuali diizinkan eksplisit
	redirect(302, url.toString(), { external: ['https://accounts.google.com'] });
}

import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ORIGIN } from '$app/env/private';

export function googleConfigured() {
	return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function getGoogle(origin) {
	const base = ORIGIN || origin;
	return new Google(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		`${base}/auth/google/callback`
	);
}

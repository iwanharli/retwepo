import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { homeFor } from '#lib/server/auth.js';
import { googleConfigured } from '#lib/server/google.js';

const ERRORS = {
	state: 'Sesi login kedaluwarsa, silakan coba lagi.',
	google: 'Gagal masuk dengan Google, silakan coba lagi.',
	email: 'Email Google belum terverifikasi.'
};

export function load({ locals, url }) {
	if (locals.user) redirect(303, homeFor(locals.user));
	return { dev, googleReady: googleConfigured(), error: ERRORS[url.searchParams.get('error')] ?? null };
}

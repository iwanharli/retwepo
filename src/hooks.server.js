import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSessionToken, setSessionCookie, deleteSessionCookie, homeFor } from '#lib/server/auth.js';
import { db } from '#lib/server/db/index.js';
import { uploadRoot } from '#lib/server/uploads.js';
import { purgeDeletedRecaps } from '#lib/server/purge-core.js';
import { DELETED_RETENTION_DAYS } from '#lib/constants.js';

// halaman yang bisa dibuka tanpa login
const PUBLIC = ['/login', '/auth/', '/privacy', '/terms'];

export async function handle({ event, resolve }) {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.user = null;
	event.locals.session = null;

	if (token) {
		const { session, user } = await validateSessionToken(token);
		if (session) {
			setSessionCookie(event, token, session.expiresAt);
			event.locals.user = user;
			event.locals.session = session;
		} else {
			deleteSessionCookie(event);
		}
	}

	const { pathname } = event.url;
	const user = event.locals.user;
	const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

	if (!isPublic && pathname !== '/logout') {
		if (!user) redirect(303, '/login');

		const home = homeFor(user);
		const approved = user.status === 'approved';

		if (pathname.startsWith('/admin') && !(approved && user.role === 'admin')) redirect(303, home);
		if (pathname.startsWith('/app') && !approved) redirect(303, home);
		if (pathname.startsWith('/uploads') && !approved) redirect(303, home);
		if (pathname === '/register' && !['incomplete', 'rejected'].includes(user.status)) redirect(303, home);
		if (pathname === '/pending' && approved) redirect(303, home);
		if (pathname === '/') redirect(303, home);
	}

	return resolve(event);
}

// ---- Tugas terjadwal: bersihkan rekap yang sudah lama dihapus admin (sekali sehari)

const DAY_MS = 24 * 60 * 60 * 1000;

async function runPurge() {
	try {
		const res = await purgeDeletedRecaps(globalThis.__retwepoPg, { uploadDir: uploadRoot(), days: DELETED_RETENTION_DAYS });
		if (res.recaps) console.log(`[purge] ${res.recaps} rekap & ${res.files} file dibersihkan (${(res.freedBytes / 1024 / 1024).toFixed(1)} MB)`);
	} catch (e) {
		console.error('[purge] gagal:', e.message);
	}
}

export function init() {
	void db; // memastikan koneksi database sudah dibuat
	// cegah timer ganda saat dev server memuat ulang modul
	clearTimeout(globalThis.__retwepoPurgeStart);
	clearInterval(globalThis.__retwepoPurgeTimer);
	globalThis.__retwepoPurgeStart = setTimeout(runPurge, 60 * 1000); // 1 menit setelah server menyala
	globalThis.__retwepoPurgeTimer = setInterval(runPurge, DAY_MS);
}

// ---- Error tak terduga: catat di log server dengan kode referensi yang juga ditampilkan ke user
export function handleError({ error, event, status }) {
	const id = crypto.randomUUID().slice(0, 8).toUpperCase();
	if (status !== 404) console.error(`[error ${id}] ${event.request.method} ${event.url.pathname}`, error);
	return { message: status === 404 ? 'Not Found' : 'Internal Error', id };
}

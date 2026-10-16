import { eq } from 'drizzle-orm';
import { EWALLET_CHECK_URL, EWALLET_CHECK_TOKEN, EWALLET_CHECK_NAME_PATH } from '$app/env/private';
import { db } from './db/index.js';
import { users } from './db/schema.js';

/*
 * Cek nama pemilik e-wallet lewat API pihak ketiga yang bisa diganti-ganti (diatur di .env).
 * Dirancang agar aplikasi TETAP JALAN bila mesin cek mati / belum diatur:
 *  - tidak pernah melempar error ke pemanggil; hasil terburuk = status 'unavailable'
 *  - batas waktu 8 detik per permintaan
 *  - circuit breaker: setelah 3 kegagalan beruntun, pengecekan dilewati 10 menit
 *  - hasil disimpan per provider:nomor, jadi tidak dicek ulang tanpa perlu
 */

const TIMEOUT_MS = 8000;
const BREAK_AFTER = 3;
const BREAK_MS = 10 * 60 * 1000;
const breaker = { fails: 0, until: 0, lastError: null };

export const checkKey = (provider, number) => (provider && number ? `${provider}:${number}`.toLowerCase() : null);

/** Status mesin cek untuk ditampilkan ke admin */
export function engineStatus() {
	if (!EWALLET_CHECK_URL) return { enabled: false, ok: false, message: 'Mesin cek belum diatur (EWALLET_CHECK_URL kosong)' };
	if (Date.now() < breaker.until)
		return { enabled: true, ok: false, message: `Mesin cek sedang tidak merespons (${breaker.lastError ?? 'gagal'}); dicoba lagi otomatis` };
	return { enabled: true, ok: true, message: 'Mesin cek aktif' };
}

const NAME_KEYS = ['account_name', 'accountName', 'name', 'nama', 'holder_name', 'customer_name', 'beneficiary_name', 'full_name'];
const NOT_FOUND = /not\s*found|tidak\s*ditemukan|invalid|unregistered|tidak\s*terdaftar|belum\s*terdaftar/i;

function pick(obj, path) {
	return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
/** cari field nama di JSON respons (beberapa level) */
function findName(obj, depth = 0) {
	if (!obj || typeof obj !== 'object' || depth > 3) return null;
	for (const k of NAME_KEYS) if (typeof obj[k] === 'string' && obj[k].trim()) return obj[k].trim();
	for (const v of Object.values(obj)) {
		const n = findName(v, depth + 1);
		if (n) return n;
	}
	return null;
}

/**
 * Hasil: { status: 'found', name } | { status: 'not_found' } | { status: 'unavailable', reason }
 */
export async function checkEwallet(provider, number) {
	const st = engineStatus();
	if (!st.ok) return { status: 'unavailable', reason: st.message };
	const local = String(number).replace(/^(\+62|62)/, '0');
	const url = EWALLET_CHECK_URL.replaceAll('{provider}', encodeURIComponent(provider.toLowerCase()))
		.replaceAll('{number62}', encodeURIComponent(local.replace(/^0/, '62')))
		.replaceAll('{number}', encodeURIComponent(local));
	try {
		const res = await fetch(url, {
			headers: { Accept: 'application/json', ...(EWALLET_CHECK_TOKEN ? { Authorization: `Bearer ${EWALLET_CHECK_TOKEN}` } : {}) },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		const text = await res.text();
		let body = null;
		try {
			body = JSON.parse(text);
		} catch {
			/* bukan JSON */
		}
		if (res.status === 404 || (body && NOT_FOUND.test(JSON.stringify(body).slice(0, 2000)) && !findName(body))) {
			breaker.fails = 0;
			return { status: 'not_found' };
		}
		if (!res.ok || !body) throw new Error(`HTTP ${res.status}${body ? '' : ' (bukan JSON)'}`);
		const raw = EWALLET_CHECK_NAME_PATH ? pick(body, EWALLET_CHECK_NAME_PATH) : findName(body);
		const name = typeof raw === 'string' ? raw.trim().slice(0, 120) : '';
		breaker.fails = 0;
		return name ? { status: 'found', name } : { status: 'not_found' };
	} catch (e) {
		breaker.lastError = e?.name === 'TimeoutError' ? 'timeout' : String(e?.message ?? e).slice(0, 80);
		if (++breaker.fails >= BREAK_AFTER) {
			breaker.until = Date.now() + BREAK_MS;
			breaker.fails = 0;
		}
		console.warn(`[ewallet-check] gagal: ${breaker.lastError}`);
		return { status: 'unavailable', reason: breaker.lastError };
	}
}

/** Cek lalu simpan ke user. Aman dipanggil tanpa await (tidak pernah reject). */
export async function checkAndStore(user) {
	try {
		const key = checkKey(user.ewalletProvider, user.ewalletNumber);
		if (!key) return null;
		const r = await checkEwallet(user.ewalletProvider, user.ewalletNumber);
		// jangan timpa hasil sukses sebelumnya dengan 'unavailable' untuk nomor yang sama
		if (r.status === 'unavailable' && user.ewalletCheckKey === key && user.ewalletCheckStatus !== 'unavailable') return r;
		await db
			.update(users)
			.set({ ewalletHolder: r.status === 'found' ? r.name : null, ewalletCheckStatus: r.status, ewalletCheckKey: key, ewalletCheckedAt: new Date() })
			.where(eq(users.id, user.id));
		return r;
	} catch (e) {
		console.warn('[ewallet-check] gagal menyimpan:', e?.message);
		return null;
	}
}

/** Hasil cek yang masih berlaku untuk nomor saat ini (null = belum dicek / nomor sudah berubah) */
export function currentCheck(u) {
	const key = checkKey(u.ewalletProvider, u.ewalletNumber);
	if (!key || u.ewalletCheckKey !== key) return null;
	return { status: u.ewalletCheckStatus, name: u.ewalletHolder, at: u.ewalletCheckedAt };
}

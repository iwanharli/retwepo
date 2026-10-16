/**
 * Pembatas sederhana (sliding window) di memori proses server.
 * Cukup untuk satu instance server; bila nanti memakai beberapa instance, pindahkan ke Redis/database.
 */
const buckets = (globalThis.__retwepoRate ??= new Map());

/**
 * Catat satu aksi dan cek batasnya.
 * @returns {{ ok: boolean, retryAfter: number }} retryAfter dalam detik bila ditolak
 */
export function hit(key, max, windowMs) {
	const now = Date.now();
	const list = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
	if (list.length >= max) {
		buckets.set(key, list);
		return { ok: false, retryAfter: Math.ceil((windowMs - (now - list[0])) / 1000) };
	}
	list.push(now);
	buckets.set(key, list);
	return { ok: true, retryAfter: 0 };
}

/** Periksa beberapa aturan sekaligus; aturan pertama yang terlampaui yang dilaporkan */
export function checkLimits(rules) {
	for (const [key, max, windowMs] of rules) {
		const r = hit(key, max, windowMs);
		if (!r.ok) return r;
	}
	return { ok: true, retryAfter: 0 };
}

export function waitText(seconds) {
	if (seconds < 60) return `${seconds} detik`;
	if (seconds < 3600) return `${Math.ceil(seconds / 60)} menit`;
	return `${Math.ceil(seconds / 3600)} jam`;
}

// bersihkan entri lama secara berkala agar memori tidak terus bertambah
clearInterval(globalThis.__retwepoRateGc);
globalThis.__retwepoRateGc = setInterval(() => {
	const now = Date.now();
	for (const [k, list] of buckets) if (!list.length || now - list[list.length - 1] > 24 * 3600 * 1000) buckets.delete(k);
}, 15 * 60 * 1000);

import { and, eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { socialAccounts } from './db/schema.js';

function cleanUrl(v) {
	const s = String(v ?? '').trim();
	if (!s) return null;
	try {
		const u = new URL(s);
		if (!['http:', 'https:'].includes(u.protocol)) throw 0;
		return u.toString();
	} catch {
		return undefined; // tidak valid
	}
}

/**
 * Baca & validasi form rekap (dipakai halaman tambah dan edit).
 * hasExistingShot: rekap lama sudah punya screenshot yang tetap dipertahankan.
 * Hasil: { error } atau { values, file, account }
 */
export async function parseRecapForm(form, user, { hasExistingShot = false } = {}) {
	const accountId = Number(form.get('accountId'));
	const type = String(form.get('type'));
	const url = cleanUrl(form.get('url'));
	const targetUrl = type === 'reply' ? cleanUrl(form.get('targetUrl')) : null;
	const note = String(form.get('note') ?? '').trim().slice(0, 1000) || null;
	const postedRaw = String(form.get('postedAt') ?? '');
	const raw = form.get('screenshot');
	const file = raw instanceof File && raw.size > 0 ? raw : null;

	const [account] = await db
		.select()
		.from(socialAccounts)
		.where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, user.id)));
	if (!account) return { error: 'Pilih akun media sosial' };
	if (account.status !== 'approved') return { error: 'Akun ini belum disetujui admin' };
	if (!['post', 'reply'].includes(type)) return { error: 'Pilih tipe rekap' };
	if (url === undefined) return { error: 'URL postingan tidak valid' };
	if (targetUrl === undefined) return { error: 'URL postingan yang dibalas tidak valid' };
	if (!url && !file && !hasExistingShot) return { error: 'Isi minimal URL atau screenshot' };

	let postedAt = new Date();
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(postedRaw)) {
		postedAt = new Date(`${postedRaw}:00+07:00`);
		if (postedAt.getTime() > Date.now() + 5 * 60000) return { error: 'Tanggal posting tidak boleh di masa depan' };
	}

	return { values: { socialAccountId: account.id, type, url, targetUrl, note, postedAt }, file, account };
}

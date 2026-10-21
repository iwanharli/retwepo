import { and, eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { socialAccounts, campaigns } from './db/schema.js';
import { urlKey, checkRecapUrl, cleanRecapUrl } from '#lib/constants.js';

function cleanUrl(v) {
	const s = String(v ?? '').trim();
	if (!s) return null;
	if (checkRecapUrl(s).error) return undefined; // tidak valid (rusak / bukan alamat web)
	return cleanRecapUrl(s);
}

/**
 * Baca & validasi form rekap (dipakai halaman tambah dan edit).
 * hasExistingShot: rekap lama sudah punya screenshot yang tetap dipertahankan.
 * currentCampaignId: kampanye rekap lama (edit) — boleh tetap dipakai walau kampanyenya sudah nonaktif.
 * Hasil: { error } atau { values, file, account }
 */
export async function parseRecapForm(form, user, { hasExistingShot = false, currentCampaignId = null } = {}) {
	const campaignId = Number(form.get('campaignId')) || 0;
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
	const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
	if (!campaign) return { error: 'Pilih kelompok kampanye' };
	if (!campaign.active && campaign.id !== currentCampaignId) return { error: `Kampanye #${campaign.name} sudah ditutup` };
	if (!['post', 'reply'].includes(type)) return { error: 'Pilih tipe rekap' };
	if (url === undefined) return { error: checkRecapUrl(form.get('url')).error ?? 'URL postingan tidak valid' };
	if (targetUrl === undefined) return { error: `URL postingan target: ${checkRecapUrl(form.get('targetUrl')).error ?? 'tidak valid'}` };
	// link harus dari platform akun yang dipilih (peringatan username tidak menghalangi)
	const urlCheck = url ? checkRecapUrl(url, account) : {};
	if (urlCheck.error) return { error: urlCheck.error };
	if (type === 'reply' && !file && !hasExistingShot) return { error: 'Rekap panel wajib menyertakan screenshot' };
	if (!url && !file && !hasExistingShot) return { error: 'Isi minimal URL atau screenshot' };

	let postedAt = new Date();
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(postedRaw)) {
		postedAt = new Date(`${postedRaw}:00+07:00`);
		if (postedAt.getTime() > Date.now() + 5 * 60000) return { error: 'Tanggal posting tidak boleh di masa depan' };
	}

	return { values: { socialAccountId: account.id, campaignId: campaign.id, type, url, urlKey: urlKey(url), targetUrl, note, postedAt }, file, account };
}

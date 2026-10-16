import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { UPLOAD_DIR } from '$app/env/private';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

export function uploadRoot() {
	return path.resolve(UPLOAD_DIR);
}

// Lebar 1600 px menjaga teks screenshot HP/retina tetap terbaca; tinggi dilonggarkan untuk screenshot panjang
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 8000;

// Entropi < 5 = gambar "datar" (UI, teks). Screenshot aplikasi ~1–3, foto ~7+.
const FLAT_ENTROPY = 5;

/**
 * Kompres ke WebP sambil menjaga kualitas:
 * - lossy q82 + smart subsample untuk semua gambar (efisien untuk foto/video)
 * - untuk gambar datar juga dicoba near-lossless (teks tetap tajam, biasanya jauh lebih kecil),
 *   lalu disimpan yang lebih kecil. Foto dilewati karena near-lossless lambat & membengkak di foto.
 */
async function compress(input) {
	const base = sharp(input, { failOn: 'error' })
		.rotate()
		.resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true });

	const { entropy } = await base.clone().resize({ width: 400 }).stats();
	const lossy = base.clone().webp({ quality: 82, smartSubsample: true, effort: 5 }).toBuffer();
	if (entropy >= FLAT_ENTROPY) return lossy;

	const [a, b] = await Promise.all([lossy, base.clone().webp({ nearLossless: true, quality: 60, effort: 5 }).toBuffer()]);
	return b.length <= a.length ? b : a;
}

/**
 * Validasi + kompres screenshot ke WebP, simpan di uploads/YYYY/MM/.
 * @param {File} file
 * @returns {Promise<string>} path relatif, mis. "2026/10/abc.webp"
 */
export async function saveScreenshot(file) {
	if (file.size > MAX_BYTES) throw new Error('Ukuran screenshot maksimal 10 MB');
	if (file.type && !ALLOWED.includes(file.type)) throw new Error('Format screenshot harus gambar (PNG/JPG/WebP)');

	const input = Buffer.from(await file.arrayBuffer());
	let output;
	try {
		output = await compress(input);
	} catch {
		throw new Error('File screenshot tidak bisa dibaca sebagai gambar');
	}

	const now = new Date();
	const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
	const name = `${crypto.randomUUID()}.webp`;
	await fs.mkdir(path.join(uploadRoot(), dir), { recursive: true });
	await fs.writeFile(path.join(uploadRoot(), dir, name), output);
	return `${dir}/${name}`;
}

export async function deleteScreenshot(rel) {
	if (!rel) return;
	await fs.rm(path.join(uploadRoot(), rel), { force: true });
}

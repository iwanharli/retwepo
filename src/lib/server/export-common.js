import { TZ, PLATFORMS, parsePlatforms } from '#lib/constants.js';
import { eq } from 'drizzle-orm';
import { startOfDay, addDays, ymd } from './dates.js';
import { db } from './db/index.js';
import { csvResponse } from './csv.js';
import { campaigns } from './db/schema.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const wib = (d) =>
	d ? new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(new Date(d)) : '';

/** Parameter umum export: kolom terpilih, pemisah, rentang (untuk menghitung rekap), status, pencarian */
export function exportParams(url, columns, allowedStatuses) {
	const p = url.searchParams;
	const valid = new Set(columns.map((c) => c.key));
	let cols = p.getAll('col').filter((c) => valid.has(c));
	if (!cols.length) cols = columns.filter((c) => c.default).map((c) => c.key);
	const from = DATE_RE.test(p.get('from') ?? '') ? p.get('from') : null;
	const to = DATE_RE.test(p.get('to') ?? '') ? p.get('to') : null;
	let statuses = p.getAll('status').filter((s) => allowedStatuses.includes(s));
	if (!statuses.length) statuses = allowedStatuses;
	return {
		cols,
		sep: p.get('sep') === 'comma' ? ',' : ';',
		from,
		to,
		start: from ? startOfDay(from).toISOString() : null,
		end: to ? startOfDay(addDays(to, 1)).toISOString() : null,
		statuses,
		q: (p.get('q') ?? '').trim().slice(0, 100),
		platforms: parsePlatforms(p),
		// ?campaign=ID → jumlah rekap hanya dari kampanye ini
		campaign: Number(p.get('campaign')) || null,
		rangeLabel: from || to ? `${from ?? 'awal'}_${to ?? ymd()}` : 'semua-waktu'
	};
}

/** Potongan nama file untuk kampanye terpilih, mis. "-rosatom" ('' bila semua kampanye) */
export async function campaignTag(id) {
	if (!id) return '';
	const [c] = await db.select({ name: campaigns.name }).from(campaigns).where(eq(campaigns.id, id));
	return c ? `-${c.name.toLowerCase()}` : '';
}

const PDF_MAX_ROWS = 5000;

/** Keterangan filter untuk kop PDF & pratinjau */
export async function describeFilters(url) {
	const p = url.searchParams;
	const out = [];
	const id = Number(p.get('campaign')) || null;
	if (id) {
		const [c] = await db.select({ name: campaigns.name }).from(campaigns).where(eq(campaigns.id, id));
		out.push(`Kampanye: #${c?.name ?? id}`);
	} else out.push('Kampanye: semua');
	const from = DATE_RE.test(p.get('from') ?? '') ? p.get('from') : null;
	const to = DATE_RE.test(p.get('to') ?? '') ? p.get('to') : null;
	const fmt = (d) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
	out.push(`Periode: ${from || to ? `${from ? fmt(from) : 'awal'} – ${to ? fmt(to) : 'sekarang'}` : 'semua waktu'}`);
	const pl = parsePlatforms(p);
	if (pl.length) out.push(`Platform: ${pl.map((k) => PLATFORMS[k].label).join(', ')}`);
	if (p.get('type') === 'post') out.push('Tipe: postingan');
	if (p.get('type') === 'reply') out.push('Tipe: panel');
	if (p.getAll('status').length) out.push(`Status: ${p.getAll('status').join(', ')}`);
	if (p.get('q')) out.push(`Cari: "${p.get('q')}"`);
	return out;
}

/**
 * Kirim hasil export sesuai ?format=: csv (default) | pdf | preview (JSON 5 baris pertama untuk contoh di halaman)
 */
export async function exportResponse(url, { filename, title }, header, rows, sep) {
	const format = url.searchParams.get('format');
	if (format === 'preview') {
		return Response.json({ header, rows: rows.slice(0, 5), total: rows.length, filename });
	}
	if (format === 'pdf') {
		const { tablePdf, pdfBuffer } = await import('./pdf.js');
		const cut = rows.length > PDF_MAX_ROWS;
		const doc = tablePdf({
			title,
			meta: await describeFilters(url),
			header,
			rows: cut ? rows.slice(0, PDF_MAX_ROWS) : rows,
			note: cut ? `Ditampilkan ${PDF_MAX_ROWS.toLocaleString('id-ID')} baris pertama dari ${rows.length.toLocaleString('id-ID')}. Gunakan CSV untuk data lengkap.` : null
		});
		return new Response(await pdfBuffer(doc), {
			headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${filename.replace(/\.csv$/, '.pdf')}"` }
		});
	}
	return csvResponse(filename, header, rows, sep);
}

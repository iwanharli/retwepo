import { TZ } from '#lib/constants.js';
import { eq } from 'drizzle-orm';
import { startOfDay, addDays, ymd } from './dates.js';
import { db } from './db/index.js';
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
		platform: p.get('platform') || null,
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

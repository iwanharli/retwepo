import { TZ } from '#lib/constants.js';
import { startOfDay, addDays, ymd } from './dates.js';

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
		rangeLabel: from || to ? `${from ?? 'awal'}_${to ?? ymd()}` : 'semua-waktu'
	};
}

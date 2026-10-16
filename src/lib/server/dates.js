import { TZ } from '#lib/constants.js';

const DAY = 86400000;

/** YYYY-MM-DD menurut zona Asia/Jakarta */
export function ymd(d = new Date()) {
	return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}

/** Awal hari (00:00 WIB) sebagai Date */
export function startOfDay(s) {
	return new Date(`${s}T00:00:00+07:00`);
}

export function addDays(s, n) {
	return ymd(new Date(startOfDay(s).getTime() + n * DAY + 12 * 3600000));
}

/**
 * Baca ?from=&to= (inklusif) dengan default 30 hari terakhir.
 * Hasil: { from, to, start, end (eksklusif), days, prevStart, prevEnd }
 */
export function parseRange(url, defaultDays = 30) {
	const re = /^\d{4}-\d{2}-\d{2}$/;
	let to = url.searchParams.get('to');
	let from = url.searchParams.get('from');
	if (!re.test(to ?? '')) to = ymd();
	if (!re.test(from ?? '')) from = addDays(to, -(defaultDays - 1));
	if (from > to) [from, to] = [to, from];

	const start = startOfDay(from);
	const end = startOfDay(addDays(to, 1));
	const days = Math.round((end - start) / DAY);
	return {
		from,
		to,
		start,
		end,
		days,
		prevStart: new Date(start.getTime() - days * DAY),
		prevEnd: start
	};
}

/** Daftar YYYY-MM-DD dari `from` sampai `to` (inklusif) */
export function dayList(from, to) {
	const out = [];
	for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
	return out;
}

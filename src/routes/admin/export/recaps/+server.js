import { error } from '@sveltejs/kit';
import { recapFilters, allRecaps, recapSummaryByUser } from '#lib/server/recaps.js';
import { csvResponse } from '#lib/server/csv.js';
import { ymd } from '#lib/server/dates.js';
import { PLATFORMS, TZ, EXPORT_COLUMNS } from '#lib/constants.js';

const wib = (d) => (d ? new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(new Date(d)) : '');

/**
 * Export rekap ke CSV.
 * Parameter: filter yang sama dengan halaman Semua Rekap, plus
 *   mode=detail|summary, col=<key> (berulang, mode detail), sep=comma|semicolon
 */
export async function GET({ url }) {
	const p = url.searchParams;
	const { f, where } = recapFilters(url);
	const sep = p.get('sep') === 'semicolon' ? ';' : ',';
	const range = f.from || f.to ? `${f.from ?? 'awal'}_${f.to ?? ymd()}` : 'semua';

	if (p.get('mode') === 'summary') {
		const rows = await recapSummaryByUser(where);
		return csvResponse(
			`ringkasan-rekap-${range}.csv`,
			['Nickname', 'Email', 'E-wallet', 'Nomor e-wallet', 'Total rekap', 'Postingan', 'Reply', 'Akun dipakai', 'Hari aktif', 'Rekap pertama (WIB)', 'Rekap terakhir (WIB)'],
			rows.map((r) => [r.nickname, r.email, r.ewalletProvider, r.ewalletNumber, r.total, r.posts, r.replies, r.accounts, r.activeDays, wib(r.firstAt), wib(r.lastAt)]),
			sep
		);
	}

	const valid = new Set(EXPORT_COLUMNS.map((c) => c.key));
	let cols = p.getAll('col').filter((c) => valid.has(c));
	if (!cols.length) cols = EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.key);
	if (cols.length > 50) error(400);

	const DEF = {
		id: [['ID'], (r) => [r.id]],
		posted_at: [['Waktu posting (WIB)'], (r) => [wib(r.postedAt)]],
		nickname: [['Nickname'], (r) => [r.nickname]],
		email: [['Email'], (r) => [r.email]],
		ewallet: [['E-wallet', 'Nomor e-wallet'], (r) => [r.ewalletProvider, r.ewalletNumber]],
		platform: [['Platform'], (r) => [PLATFORMS[r.platform].label]],
		username: [['Username'], (r) => [r.username]],
		type: [['Tipe'], (r) => [r.type === 'post' ? 'Postingan' : 'Reply']],
		url: [['URL'], (r) => [r.url]],
		target_url: [['URL dibalas'], (r) => [r.targetUrl]],
		screenshot: [['Screenshot'], (r) => [r.screenshotPath ? `${url.origin}/uploads/${r.screenshotPath}` : '']],
		note: [['Catatan'], (r) => [r.note]],
		created_at: [['Dicatat (WIB)'], (r) => [wib(r.createdAt)]],
		edited_at: [['Diedit (WIB)'], (r) => [wib(r.editedAt)]]
	};

	const rows = await allRecaps(where);
	return csvResponse(
		`rekap-${range}.csv`,
		cols.flatMap((c) => DEF[c][0]),
		rows.map((r) => cols.flatMap((c) => DEF[c][1](r))),
		sep
	);
}

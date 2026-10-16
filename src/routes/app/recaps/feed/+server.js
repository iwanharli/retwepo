import { json } from '@sveltejs/kit';
import { recapFilters, listRecaps, pageNum, recapSort, RECAP_DEFAULT_DAYS } from '#lib/server/recaps.js';

// Halaman berikutnya untuk infinite scroll di Riwayat Rekap
export async function GET({ locals, url }) {
	const { where } = recapFilters(url, { userId: locals.user.id, defaultDays: RECAP_DEFAULT_DAYS });
	return json(await listRecaps(where, pageNum(url), undefined, recapSort(url).order));
}

import { json } from '@sveltejs/kit';
import { recapFilters, listRecaps, pageNum, recapSort, RECAP_DEFAULT_DAYS } from '#lib/server/recaps.js';

// Halaman berikutnya untuk infinite scroll di Semua Rekap (admin)
export async function GET({ url }) {
	const { where } = recapFilters(url, { defaultDays: RECAP_DEFAULT_DAYS });
	return json(await listRecaps(where, pageNum(url), undefined, recapSort(url).order));
}

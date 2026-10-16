import { json } from '@sveltejs/kit';
import { urlKey } from '#lib/constants.js';
import { findDuplicates } from '#lib/server/duplicates.js';

// cek cepat saat user mengisi URL di form rekap (?url=&exclude=<id rekap yang sedang diedit>)
export async function GET({ url, locals }) {
	const key = urlKey(url.searchParams.get('url'));
	return json(await findDuplicates(key, locals.user.id, Number(url.searchParams.get('exclude')) || null));
}

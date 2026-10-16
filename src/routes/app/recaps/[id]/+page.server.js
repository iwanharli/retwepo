import { error } from '@sveltejs/kit';
import { getRecap, getRecapEdits } from '#lib/server/recaps.js';

export async function load({ params, locals }) {
	const r = await getRecap(params.id, { userId: locals.user.id });
	if (!r) error(404, 'Rekap tidak ditemukan');
	return { r, history: await getRecapEdits(r.id) };
}

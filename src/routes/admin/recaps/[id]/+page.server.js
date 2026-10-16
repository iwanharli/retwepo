import { error, redirect } from '@sveltejs/kit';
import { getRecap, getRecapEdits } from '#lib/server/recaps.js';
import { deleteRecapAsAdmin, restoreRecapAsAdmin } from '#lib/server/recap-delete.js';

export async function load({ params }) {
	const r = await getRecap(params.id);
	if (!r) error(404, 'Rekap tidak ditemukan');
	return { r, history: await getRecapEdits(r.id) };
}

export const actions = {
	delete: async ({ params, request, locals }) => {
		const form = await request.formData();
		const res = await deleteRecapAsAdmin(locals.user, Number(params.id) || 0, String(form.get('note') ?? '').trim());
		if (res.error) return res.error;
		redirect(303, `/admin/recaps/${params.id}`);
	},
	restore: async ({ params, locals }) => {
		const res = await restoreRecapAsAdmin(locals.user, Number(params.id) || 0);
		if (res.error) return res.error;
		return { success: 'Rekap dipulihkan' };
	}
};

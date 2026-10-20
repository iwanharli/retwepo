import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { listCampaigns } from '#lib/server/campaigns.js';
import { recapFilters, listRecaps, recapSort, recapStatusCounts, RECAP_DEFAULT_DAYS } from '#lib/server/recaps.js';
import { deleteRecapAsAdmin, restoreRecapAsAdmin } from '#lib/server/recap-delete.js';

export async function load({ url }) {
	const { f, where } = recapFilters(url, { defaultDays: RECAP_DEFAULT_DAYS });
	const sort = recapSort(url);
	const [list, statusCounts, [filterUser], campaigns] = await Promise.all([
		listRecaps(where, 1, undefined, sort.order),
		recapStatusCounts(),
		// ?user=ID (dari halaman detail user) ditampilkan sebagai chip yang bisa dihapus
		f.user
			? db.select({ id: users.id, nickname: users.nickname, email: users.email }).from(users).where(eq(users.id, f.user))
			: [[]],
		listCampaigns()
	]);
	return {
		f,
		list,
		statusCounts,
		campaigns,
		sort: { key: sort.key, dir: sort.dir },
		filterUser: filterUser?.id ? filterUser : null,
		view: url.searchParams.get('view') === 'list' ? 'list' : 'grid'
	};
}

export const actions = {
	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const res = await deleteRecapAsAdmin(locals.user, Number(form.get('id')), String(form.get('note') ?? '').trim());
		if (res.error) return res.error;
		return { success: 'Rekap dihapus' };
	},
	restore: async ({ request, locals }) => {
		const res = await restoreRecapAsAdmin(locals.user, Number((await request.formData()).get('id')));
		if (res.error) return res.error;
		return { success: 'Rekap dipulihkan' };
	}
};

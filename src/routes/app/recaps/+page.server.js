import { eq, asc } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { socialAccounts } from '#lib/server/db/schema.js';
import { listCampaigns } from '#lib/server/campaigns.js';
import { recapFilters, listRecaps, recapSort, recapStatusCounts, RECAP_DEFAULT_DAYS } from '#lib/server/recaps.js';

export async function load({ locals, url }) {
	const { f, where } = recapFilters(url, { userId: locals.user.id, defaultDays: RECAP_DEFAULT_DAYS });
	const sort = recapSort(url);
	const [list, statusCounts, accounts, campaigns] = await Promise.all([
		listRecaps(where, 1, undefined, sort.order),
		recapStatusCounts(locals.user.id),
		db
			.select({ id: socialAccounts.id, platform: socialAccounts.platform, username: socialAccounts.username })
			.from(socialAccounts)
			.where(eq(socialAccounts.userId, locals.user.id))
			.orderBy(asc(socialAccounts.platform)),
		listCampaigns()
	]);
	return { f, list, statusCounts, accounts, campaigns, sort: { key: sort.key, dir: sort.dir }, view: url.searchParams.get('view') === 'list' ? 'list' : 'grid' };
}

import { parseRange } from '#lib/server/dates.js';
import { adminStats } from '#lib/server/stats.js';
import { PLATFORMS } from '#lib/constants.js';
import { listCampaigns } from '#lib/server/campaigns.js';

export async function load({ url }) {
	const range = parseRange(url);
	const platform = PLATFORMS[url.searchParams.get('platform')] ? url.searchParams.get('platform') : null;
	const campaigns = await listCampaigns();
	const campaign = campaigns.find((c) => c.id === Number(url.searchParams.get('campaign')))?.id ?? null;
	const stats = await adminStats({ ...range, platform, campaign });
	return { range: { from: range.from, to: range.to, days: range.days }, platform, campaign, campaigns, stats, query: url.search };
}

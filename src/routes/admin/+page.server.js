import { parseRange } from '#lib/server/dates.js';
import { adminStats, campaignStats } from '#lib/server/stats.js';
import { parsePlatforms } from '#lib/constants.js';
import { listCampaigns } from '#lib/server/campaigns.js';

// ?tab= bagian halaman statistik
const TABS = ['ringkasan', 'pengguna', 'waktu', 'kampanye'];

export async function load({ url }) {
	const range = parseRange(url);
	const tab = TABS.includes(url.searchParams.get('tab')) ? url.searchParams.get('tab') : 'ringkasan';
	const platforms = parsePlatforms(url.searchParams);
	const campaigns = await listCampaigns();
	const campaign = campaigns.find((c) => c.id === Number(url.searchParams.get('campaign')))?.id ?? null;
	const [stats, cstats] = await Promise.all([
		adminStats({ ...range, platforms, campaign }),
		tab === 'kampanye' ? campaignStats({ ...range, platforms }) : null
	]);
	return { range: { from: range.from, to: range.to, days: range.days }, tab, platforms, campaign, campaigns, stats, cstats, query: url.search };
}

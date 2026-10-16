import { parseRange } from '#lib/server/dates.js';
import { adminStats } from '#lib/server/stats.js';
import { PLATFORMS } from '#lib/constants.js';

export async function load({ url }) {
	const range = parseRange(url);
	const platform = PLATFORMS[url.searchParams.get('platform')] ? url.searchParams.get('platform') : null;
	const stats = await adminStats({ ...range, platform });
	return { range: { from: range.from, to: range.to, days: range.days }, platform, stats, query: url.search };
}

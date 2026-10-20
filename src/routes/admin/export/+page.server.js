import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';

// Halaman pusat export: semua CSV diunduh dari sini (bisa dipilih per kampanye)
export async function load({ url }) {
	const [campaigns, [counts]] = await Promise.all([
		db.execute(sql`
			SELECT c.id, c.name, c.active, count(r.id)::int AS total,
				count(r.id) FILTER (WHERE r.posted_at >= now() - interval '30 days')::int AS month
			FROM campaigns c LEFT JOIN active_recaps r ON r.campaign_id = c.id
			GROUP BY c.id ORDER BY c.sort_order, c.id`),
		db.execute(sql`
			SELECT (SELECT count(*) FROM active_recaps)::int AS recaps,
				(SELECT count(*) FROM users)::int AS users,
				(SELECT count(*) FROM social_accounts)::int AS accounts`)
	]);
	// nilai awal dari halaman asal (mis. tombol Export di Semua Rekap membawa filternya)
	const p = url.searchParams;
	const prefill = Object.fromEntries(['type', 'from', 'to', 'campaign', 'platform', 'q', 'user', 'account', 'evidence', 'rtype'].map((k) => [k, p.get(k) ?? '']));
	prefill.status = p.getAll('status');
	prefill.platform = p.getAll('platform').join(',');
	return { campaigns: [...campaigns], counts, prefill };
}

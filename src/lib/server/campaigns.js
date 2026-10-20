import { asc, eq, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { campaigns, recaps } from './db/schema.js';

/** Daftar kampanye untuk dropdown/filter. activeOnly: hanya yang masih bisa dipilih di form rekap. */
export async function listCampaigns({ activeOnly = false } = {}) {
	const q = db
		.select({ id: campaigns.id, name: campaigns.name, active: campaigns.active })
		.from(campaigns)
		.orderBy(asc(campaigns.sortOrder), asc(campaigns.id));
	return activeOnly ? q.where(eq(campaigns.active, true)) : q;
}

/** Kampanye rekap terakhir user (nilai awal dropdown), bila masih aktif */
export async function lastCampaignId(userId) {
	const [r] = await db.execute(sql`
		SELECT r.campaign_id FROM ${recaps} r JOIN ${campaigns} c ON c.id = r.campaign_id
		WHERE r.user_id = ${userId} AND c.active ORDER BY r.created_at DESC LIMIT 1`);
	return r?.campaign_id ?? null;
}

/** Normalisasi nama kampanye: tanpa '#', tanpa spasi; huruf, angka, _ saja */
export function cleanCampaignName(v) {
	const name = String(v ?? '').trim().replace(/^#+/, '').replace(/\s+/g, '');
	if (!/^[A-Za-z0-9_]{2,60}$/.test(name)) return null;
	return name;
}

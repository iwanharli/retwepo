import { fail } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { campaigns } from '#lib/server/db/schema.js';
import { cleanCampaignName } from '#lib/server/campaigns.js';
import { logAdmin } from '#lib/server/audit.js';
import { notifyAllUsers } from '#lib/server/reminders.js';

export async function load() {
	const rows = await db.execute(sql`
		SELECT c.id, c.name, c.active, c.sort_order, c.created_at,
			count(r.id)::int AS total,
			count(r.id) FILTER (WHERE r.posted_at >= now() - interval '30 days')::int AS month,
			count(DISTINCT r.user_id)::int AS users,
			max(r.posted_at) AS last_at
		FROM campaigns c LEFT JOIN active_recaps r ON r.campaign_id = c.id
		GROUP BY c.id ORDER BY c.sort_order, c.id`);
	return { campaigns: [...rows] };
}

const NAME_HINT = 'Nama kampanye 2–60 karakter: huruf, angka, atau _ (tanpa spasi)';
const isDupName = (e) => e?.code === '23505' || e?.cause?.code === '23505';

async function byId(form) {
	const [c] = await db.select().from(campaigns).where(eq(campaigns.id, Number(form.get('id')) || 0));
	return c ?? null;
}

export const actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = cleanCampaignName(form.get('name'));
		if (!name) return fail(400, { error: NAME_HINT });
		try {
			const [{ max }] = await db.execute(sql`SELECT coalesce(max(sort_order), 0)::int AS max FROM campaigns`);
			const [c] = await db.insert(campaigns).values({ name, sortOrder: max + 1 }).returning();
			await logAdmin(locals.user, { action: 'createCampaign', targetType: 'campaign', targetId: c.id, targetLabel: `#${name}` });
		} catch (e) {
			if (isDupName(e)) return fail(400, { error: `Kampanye #${name} sudah ada` });
			throw e;
		}
		let sent = 0;
		if (form.get('notify') === '1')
			sent = await notifyAllUsers({
				type: 'campaign_opened',
				title: `Kampanye baru: #${name}`,
				body: `Kampanye #${name} sudah dibuka. Pilih kampanye ini di form rekap saat mencatat postingan atau panel.`,
				link: '/app/recaps/new'
			});
		return { success: `Kampanye #${name} ditambahkan${sent ? ` · ${sent} user diberi tahu` : ''}` };
	},

	rename: async ({ request, locals }) => {
		const form = await request.formData();
		const c = await byId(form);
		if (!c) return fail(404, { error: 'Kampanye tidak ditemukan' });
		const name = cleanCampaignName(form.get('name'));
		if (!name) return fail(400, { error: NAME_HINT });
		if (name === c.name) return fail(400, { error: 'Nama tidak berubah' });
		try {
			await db.update(campaigns).set({ name }).where(eq(campaigns.id, c.id));
		} catch (e) {
			if (isDupName(e)) return fail(400, { error: `Kampanye #${name} sudah ada` });
			throw e;
		}
		await logAdmin(locals.user, { action: 'renameCampaign', targetType: 'campaign', targetId: c.id, targetLabel: `#${name}`, meta: { before: c.name, after: name } });
		return { success: `#${c.name} diganti menjadi #${name}` };
	},

	// tutup / buka kembali: kampanye yang ditutup tidak bisa dipilih di form rekap baru
	toggle: async ({ request, locals }) => {
		const form = await request.formData();
		const c = await byId(form);
		if (!c) return fail(404, { error: 'Kampanye tidak ditemukan' });
		if (c.active) {
			const [{ n }] = await db.execute(sql`SELECT count(*)::int AS n FROM campaigns WHERE active AND id <> ${c.id}`);
			if (!n) return fail(400, { error: 'Minimal harus ada satu kampanye aktif' });
		}
		await db.update(campaigns).set({ active: !c.active }).where(eq(campaigns.id, c.id));
		await logAdmin(locals.user, {
			action: c.active ? 'closeCampaign' : 'openCampaign',
			targetType: 'campaign',
			targetId: c.id,
			targetLabel: `#${c.name}`,
			note: String(form.get('note') ?? '').trim() || null
		});
		let sent = 0;
		if (form.get('notify') === '1')
			sent = await notifyAllUsers(
				c.active
					? { type: 'campaign_closed', title: `Kampanye #${c.name} ditutup`, body: 'Rekap baru tidak bisa lagi memakai kampanye ini. Rekap yang sudah ada tetap tersimpan.', link: '/app' }
					: { type: 'campaign_opened', title: `Kampanye #${c.name} dibuka kembali`, body: `Anda bisa kembali memilih #${c.name} di form rekap.`, link: '/app/recaps/new' }
			);
		const msg = c.active ? `Kampanye #${c.name} ditutup` : `Kampanye #${c.name} dibuka kembali`;
		return { success: `${msg}${sent ? ` · ${sent} user diberi tahu` : ''}` };
	}
};

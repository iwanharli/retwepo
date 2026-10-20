import { fail } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { logAdmin } from '#lib/server/audit.js';
import { notifyAllUsers } from '#lib/server/reminders.js';

// tujuan klik notifikasi pengumuman (hanya halaman di dalam aplikasi)
const ANNOUNCE_LINKS = [
	['', 'Tanpa tautan (buka daftar notifikasi)'],
	['/app', 'Dashboard'],
	['/app/recaps/new', 'Tambah Rekap'],
	['/app/recaps', 'Riwayat Rekap'],
	['/app/accounts', 'Akun Sosmed'],
	['/app/profile', 'Profil']
];

export async function load() {
	const [history, [{ recipients }]] = await Promise.all([
		db.execute(sql`
			SELECT l.id, l.created_at, l.meta, u.nickname AS admin_nickname, u.email AS admin_email,
				(SELECT count(*) FILTER (WHERE n.read_at IS NOT NULL)::int FROM notifications n
					WHERE n.type = 'announcement' AND n.title = l.meta ->> 'title'
						AND n.created_at BETWEEN l.created_at - interval '1 minute' AND l.created_at + interval '1 minute') AS read
			FROM admin_logs l LEFT JOIN users u ON u.id = l.admin_id
			WHERE l.action = 'announce' ORDER BY l.created_at DESC LIMIT 20`),
		db.execute(sql`SELECT count(*)::int AS recipients FROM users WHERE status = 'approved' AND role = 'user'`)
	]);
	return { history: [...history], recipients, links: ANNOUNCE_LINKS };
}

export const actions = {
	send: async ({ request, locals }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const body = String(form.get('body') ?? '').trim() || null;
		const link = String(form.get('link') ?? '');
		if (title.length < 3 || title.length > 120) return fail(400, { error: 'Judul pengumuman 3–120 karakter' });
		if (body && body.length > 1000) return fail(400, { error: 'Isi pengumuman maksimal 1.000 karakter' });
		if (!ANNOUNCE_LINKS.some(([v]) => v === link)) return fail(400, { error: 'Tautan tidak valid' });

		const sent = await db.transaction(async (tx) => {
			const n = await notifyAllUsers({ type: 'announcement', title, body, link: link || null }, tx);
			await logAdmin(locals.user, { action: 'announce', targetType: 'announcement', targetLabel: title, note: body, meta: { title, body, link, recipients: n } }, tx);
			return n;
		});
		return { success: `Pengumuman terkirim ke ${sent} user` };
	}
};

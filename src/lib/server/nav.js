import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

// `icon` adalah kunci ikon Lucide yang dipetakan di Shell.svelte
// `cta`: tidak tampil di daftar menu, tapi sebagai tombol mencolok di bawah sidebar
const USER_NAV = [
	{ section: 'Menu' },
	{ href: '/app', label: 'Dashboard', icon: 'dashboard' },
	{ href: '/app/recaps', label: 'Riwayat Rekap', icon: 'history' },
	{ href: '/app/accounts', label: 'Akun Sosmed', icon: 'accounts' },
	{ href: '/app/notifications', label: 'Notifikasi', icon: 'bell' },
	{ href: '/app/profile', label: 'Profil', icon: 'profile' },
	{ href: '/app/recaps/new', label: 'Tambah Rekap', icon: 'add', cta: true }
];

// Admin hanya melihat menu pemantauan & verifikasi (tanpa fitur rekap pribadi)
const ADMIN_NAV = [
	{ section: 'Pemantauan' },
	{ href: '/admin', label: 'Statistik', icon: 'stats' },
	{ href: '/admin/recaps', label: 'Semua Rekap', icon: 'gallery' },
	{ section: 'Pengguna' },
	{ href: '/admin/members', label: 'User Terverifikasi', icon: 'users' },
	{ href: '/admin/social', label: 'Akun Terverifikasi', icon: 'badgeCheck' },
	{ section: 'Verifikasi' },
	{ href: '/admin/users', label: 'Pendaftaran User', icon: 'userPlus' },
	{ href: '/admin/accounts', label: 'Pengajuan Akun', icon: 'verify' },
	{ section: 'Sistem' },
	{ href: '/admin/campaigns', label: 'Kelompok Kampanye', icon: 'campaign' },
	{ href: '/admin/logs', label: 'Log Aktivitas', icon: 'logs' },
	{ section: 'Akun' },
	{ href: '/app/profile', label: 'Profil', icon: 'profile' }
];

export function publicUser(u) {
	return { id: u.id, email: u.email, nickname: u.nickname, avatarUrl: u.avatarUrl, role: u.role };
}

/** Data kerangka aplikasi (sidebar, header) — sama untuk semua halaman /app dan /admin. */
export async function shellData({ locals, cookies }) {
	const isAdmin = locals.user.role === 'admin';
	let badges = {};
	let inbox = null;
	if (!isAdmin) {
		// notifikasi untuk lonceng di header
		const [items, [{ unread }]] = await Promise.all([
			db.execute(sql`SELECT id, type, title, body, link, read_at, created_at FROM notifications WHERE user_id = ${locals.user.id} ORDER BY created_at DESC LIMIT 8`),
			db.execute(sql`SELECT count(*)::int AS unread FROM notifications WHERE user_id = ${locals.user.id} AND read_at IS NULL`)
		]);
		inbox = { items: [...items], unread };
		badges = { '/app/notifications': unread };
	}
	if (isAdmin) {
		const [c] = await db.execute(sql`
			SELECT (SELECT count(*) FROM users WHERE status = 'pending')::int AS users,
				(SELECT count(*) FROM social_accounts a JOIN users u ON u.id = a.user_id
					WHERE a.status = 'pending' AND u.status = 'approved')::int AS accounts`);
		badges = { '/admin/users': c.users, '/admin/accounts': c.accounts };
	}
	return {
		me: publicUser(locals.user),
		nav: isAdmin ? ADMIN_NAV : USER_NAV,
		badges,
		inbox,
		sidebarCollapsed: cookies.get('sidebar') === 'collapsed'
	};
}

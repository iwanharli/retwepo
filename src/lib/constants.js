export const PLATFORMS = {
	twitter: { label: 'X (Twitter)', color: '#0f172a', short: 'X', profile: (u) => `https://x.com/${u}` },
	instagram: { label: 'Instagram', color: '#e4405f', short: 'IG', profile: (u) => `https://instagram.com/${u}` },
	threads: { label: 'Threads', color: '#52525b', short: 'TH', profile: (u) => `https://threads.net/@${u}` },
	youtube: { label: 'YouTube', color: '#ef4444', short: 'YT', profile: (u) => `https://youtube.com/@${u}` },
	facebook: { label: 'Facebook', color: '#0866ff', short: 'FB', profile: (u) => `https://facebook.com/${u}` }
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS);

export const EWALLETS = ['DANA', 'OVO', 'GoPay', 'ShopeePay', 'LinkAja'];

export const RECAP_TYPES = { post: 'Postingan', reply: 'Reply' };

export const USER_STATUS = {
	incomplete: { label: 'Belum daftar', cls: 'bg-slate-100 text-slate-600' },
	pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
	approved: { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700' },
	rejected: { label: 'Ditolak', cls: 'bg-rose-100 text-rose-700' },
	suspended: { label: 'Ditangguhkan', cls: 'bg-slate-200 text-slate-700' }
};

export const ACCOUNT_STATUS = {
	pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
	approved: { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700' },
	rejected: { label: 'Ditolak', cls: 'bg-rose-100 text-rose-700' }
};

export const TZ = 'Asia/Jakarta';

/** Rekap yang dihapus admin dihapus permanen (beserta screenshot) setelah sekian hari */
export const DELETED_RETENTION_DAYS = 90;

/** Tanggal rekap terhapus akan dibersihkan permanen */
export function purgeDate(deletedAt) {
	return new Date(new Date(deletedAt).getTime() + DELETED_RETENTION_DAYS * 86400000);
}

/** "@Nama.User " -> "nama.user" */
export function normalizeUsername(raw) {
	let u = String(raw ?? '').trim();
	// izinkan user menempel URL profil
	const m = u.match(/^https?:\/\/[^/]+\/(?:@)?([^/?#]+)/i);
	if (m) u = m[1];
	return u.replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
}

export function fmtDate(d, withTime = false) {
	if (!d) return '-';
	return new Intl.DateTimeFormat('id-ID', {
		timeZone: TZ,
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
	}).format(new Date(d));
}

export function fmtNum(n) {
	return new Intl.NumberFormat('id-ID').format(Number(n ?? 0));
}

/** Pilihan cepat rentang tanggal di halaman rekap: [jumlah hari | null = semua, label] */
export const RANGE_PRESETS = [
	[1, 'Hari ini'],
	[7, '7 hari'],
	[30, '30 hari'],
	[90, '90 hari'],
	[null, 'Semua waktu']
];

/** Kolom yang bisa dipilih saat export rekap (mode detail) */
export const EXPORT_COLUMNS = [
	{ key: 'posted_at', label: 'Waktu posting', default: true },
	{ key: 'nickname', label: 'Nickname', default: true },
	{ key: 'email', label: 'Email', default: true },
	{ key: 'ewallet', label: 'E-wallet & nomor', default: false },
	{ key: 'platform', label: 'Platform', default: true },
	{ key: 'username', label: 'Username sosmed', default: true },
	{ key: 'type', label: 'Tipe (post/reply)', default: true },
	{ key: 'url', label: 'URL', default: true },
	{ key: 'target_url', label: 'URL yang dibalas', default: false },
	{ key: 'screenshot', label: 'Link screenshot', default: true },
	{ key: 'note', label: 'Catatan', default: false },
	{ key: 'created_at', label: 'Waktu dicatat', default: false },
	{ key: 'edited_at', label: 'Waktu diedit', default: false },
	{ key: 'id', label: 'ID rekap', default: false }
];

/** Link detail user di admin: user terverifikasi/ditangguhkan ada di menu "User Terverifikasi" */
export function adminUserHref(id, status) {
	return ['approved', 'suspended'].includes(status) ? `/admin/members/${id}` : `/admin/users/${id}`;
}

/** Kolom export user */
export const USER_EXPORT_COLUMNS = [
	{ key: 'nickname', label: 'Nama panggilan', default: true },
	{ key: 'email', label: 'Email', default: true },
	{ key: 'role', label: 'Peran', default: false },
	{ key: 'status', label: 'Status', default: true },
	{ key: 'ewallet', label: 'E-wallet & nomor', default: true },
	{ key: 'accounts', label: 'Akun sosmed', default: true },
	{ key: 'total', label: 'Jumlah rekap', default: true },
	{ key: 'posts', label: 'Postingan', default: true },
	{ key: 'replies', label: 'Reply', default: true },
	{ key: 'active_days', label: 'Hari aktif', default: false },
	{ key: 'last_at', label: 'Rekap terakhir', default: true },
	{ key: 'registered_at', label: 'Tanggal daftar', default: false },
	{ key: 'status_note', label: 'Catatan status', default: false },
	{ key: 'id', label: 'ID user', default: false }
];

/** Kolom export akun sosmed */
export const ACCOUNT_EXPORT_COLUMNS = [
	{ key: 'platform', label: 'Platform', default: true },
	{ key: 'username', label: 'Username', default: true },
	{ key: 'profile_url', label: 'Link profil', default: true },
	{ key: 'owner', label: 'Pemilik (nama)', default: true },
	{ key: 'owner_email', label: 'Email pemilik', default: true },
	{ key: 'status', label: 'Status verifikasi', default: true },
	{ key: 'status_note', label: 'Alasan ditolak/dicabut', default: false },
	{ key: 'total', label: 'Jumlah rekap', default: true },
	{ key: 'posts', label: 'Postingan', default: false },
	{ key: 'replies', label: 'Reply', default: false },
	{ key: 'last_at', label: 'Rekap terakhir', default: true },
	{ key: 'created_at', label: 'Tanggal diajukan', default: false },
	{ key: 'reviewed_at', label: 'Tanggal ditinjau', default: false },
	{ key: 'id', label: 'ID akun', default: false }
];

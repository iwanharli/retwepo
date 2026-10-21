export const PLATFORMS = {
	twitter: { label: 'X (Twitter)', color: '#0f172a', short: 'X', profile: (u) => `https://x.com/${u}` },
	instagram: { label: 'Instagram', color: '#f97316', short: 'IG', profile: (u) => `https://instagram.com/${u}` },
	threads: { label: 'Threads', color: '#52525b', short: 'TH', profile: (u) => `https://threads.net/@${u}` },
	youtube: { label: 'YouTube', color: '#ef4444', short: 'YT', profile: (u) => `https://youtube.com/@${u}` },
	facebook: { label: 'Facebook', color: '#0866ff', short: 'FB', profile: (u) => `https://facebook.com/${u}` },
	tiktok: { label: 'TikTok', color: '#06b6d4', short: 'TT', profile: (u) => `https://tiktok.com/@${u}` }
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS);

export const EWALLETS = ['DANA', 'OVO', 'GoPay', 'ShopeePay', 'LinkAja'];

export const RECAP_TYPES = { post: 'Postingan', reply: 'Panel' };

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


/** Kolom yang bisa dipilih saat export rekap (mode detail) */
export const EXPORT_COLUMNS = [
	{ key: 'posted_at', label: 'Waktu posting', default: true },
	{ key: 'nickname', label: 'Nickname', default: true },
	{ key: 'email', label: 'Email', default: true },
	{ key: 'ewallet', label: 'E-wallet & nomor', default: false },
	{ key: 'campaign', label: 'Kampanye', default: true },
	{ key: 'platform', label: 'Platform', default: true },
	{ key: 'username', label: 'Username sosmed', default: true },
	{ key: 'type', label: 'Tipe (postingan/panel)', default: true },
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
	{ key: 'replies', label: 'Panel', default: true },
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
	{ key: 'replies', label: 'Panel', default: false },
	{ key: 'last_at', label: 'Rekap terakhir', default: true },
	{ key: 'created_at', label: 'Tanggal diajukan', default: false },
	{ key: 'reviewed_at', label: 'Tanggal ditinjau', default: false },
	{ key: 'id', label: 'ID akun', default: false }
];

/**
 * Kunci URL untuk mendeteksi rekap duplikat: link berbeda bentuk yang menunjuk ke postingan
 * yang sama menghasilkan kunci yang sama (twitter.com = x.com, tanpa ?s=…, tanpa "/" akhir, dsb.).
 * @returns {string|null}
 */
export function urlKey(raw) {
	if (!raw) return null;
	let u;
	try {
		u = new URL(String(raw).trim());
	} catch {
		return null;
	}
	let host = u.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.|mbasic\.|web\.)/, '');
	const parts = u.pathname.split('/').filter(Boolean);
	const v = (k) => u.searchParams.get(k);

	if (host === 'twitter.com' || host === 'x.com') {
		// ID status unik secara global → abaikan username
		const i = parts.findIndex((p) => p === 'status' || p === 'statuses');
		if (i >= 0 && parts[i + 1]) return `x.com/status/${parts[i + 1]}`;
		host = 'x.com';
	}
	if (host === 'instagram.com') {
		const i = parts.findIndex((p) => ['p', 'reel', 'reels', 'tv'].includes(p));
		if (i >= 0 && parts[i + 1]) return `instagram.com/p/${parts[i + 1]}`;
	}
	if (host === 'threads.net' || host === 'threads.com') {
		const i = parts.indexOf('post');
		if (i >= 0 && parts[i + 1]) return `threads.net/post/${parts[i + 1]}`;
		host = 'threads.net';
	}
	if (host === 'youtu.be' && parts[0]) return `youtube.com/v/${parts[0]}`;
	if (host === 'youtube.com') {
		if (v('v')) return `youtube.com/v/${v('v')}${v('lc') ? `/c/${v('lc')}` : ''}`;
		if (parts[0] === 'shorts' && parts[1]) return `youtube.com/v/${parts[1]}`;
	}
	if (host === 'facebook.com' || host === 'fb.com') {
		host = 'facebook.com';
		const id = v('story_fbid') || v('fbid') || v('v');
		if (id) return `facebook.com/${id}${v('comment_id') ? `/c/${v('comment_id')}` : ''}`;
	}
	if (host === 'tiktok.com') {
		// ID video unik secara global → abaikan username
		const i = parts.findIndex((p) => p === 'video' || p === 'photo');
		if (i >= 0 && parts[i + 1]) return `tiktok.com/video/${parts[i + 1]}`;
	}
	// umum: host + path (tanpa query, hash, dan "/" akhir); path dibiarkan peka huruf besar/kecil
	return `${host}/${parts.join('/')}`;
}

/** Platform terpilih dari query string: ?platform=x&platform=tiktok (atau dipisah koma); hanya kunci yang valid */
export function parsePlatforms(searchParams) {
	return [...new Set(searchParams.getAll('platform').flatMap((v) => v.split(',')))].filter((k) => PLATFORMS[k]);
}

// ---- Validasi link rekap terhadap akun yang dipilih (dipakai di form & server)

/** Domain yang sah untuk tiap platform */
export const PLATFORM_HOSTS = {
	twitter: ['x.com', 'twitter.com', 't.co'],
	instagram: ['instagram.com', 'instagr.am'],
	threads: ['threads.net', 'threads.com'],
	youtube: ['youtube.com', 'youtu.be'],
	facebook: ['facebook.com', 'fb.com', 'fb.watch'],
	tiktok: ['tiktok.com']
};

const hostOf = (u) => u.hostname.toLowerCase().replace(/^(www|m|mobile|mbasic|web|vt|vm)\./, '');
export const platformOfUrl = (u) => Object.keys(PLATFORM_HOSTS).find((p) => PLATFORM_HOSTS[p].some((h) => hostOf(u) === h || hostOf(u).endsWith(`.${h}`))) ?? null;

/** Username yang tertera di link (bila formatnya memuat username) */
function usernameInUrl(u, platform) {
	const parts = u.pathname.split('/').filter(Boolean);
	if (platform === 'twitter' && parts[1] === 'status') return parts[0];
	if ((platform === 'tiktok' || platform === 'threads' || platform === 'youtube') && parts[0]?.startsWith('@')) return parts[0].slice(1);
	return null;
}

/**
 * Periksa link rekap.
 * Hasil: { error } — link pasti salah (ditolak) | { warning } — perlu dicek ulang | {} — aman.
 * platform/username: akun sosmed yang dipilih (boleh kosong untuk link target panel)
 */
/** Lengkapi "instagram.com/reel/…" menjadi "https://instagram.com/reel/…" */
export const withScheme = (raw) => {
	const s = String(raw ?? '').trim();
	return s && !/^[a-z][a-z0-9+.-]*:/i.test(s) && /^[\w-]+(\.[\w-]+)+(\/|$)/i.test(s) ? `https://${s}` : s;
};

/** Username di link rekap yang BERBEDA dari akunnya (huruf kecil), atau null */
export function mismatchedUsername(raw, { platform, username }) {
	try {
		const u = new URL(withScheme(raw));
		if (platformOfUrl(u) !== platform) return null;
		const x = usernameInUrl(u, platform);
		return x && username && x.toLowerCase() !== username.toLowerCase() ? x.toLowerCase() : null;
	} catch {
		return null;
	}
}

export function checkRecapUrl(raw, { platform = null, username = null } = {}) {
	const s = withScheme(raw);
	if (!s) return {};
	// dua link tertempel jadi satu, mis. "https://www.inshttps//www.threads.com/…"
	if ((s.match(/https?:?\/\//gi) ?? []).length > 1 || /https?\/\//i.test(s.replace(/^https?:\/\//i, ''))) return { error: 'Link tidak valid — sepertinya dua link tertempel jadi satu. Hapus lalu tempel ulang.' };
	if (/\s/.test(s)) return { error: 'Link tidak boleh mengandung spasi.' };
	let u;
	try {
		u = new URL(s);
	} catch {
		return { error: 'Link tidak valid. Salin link langsung dari aplikasi (menu Bagikan → Salin link).' };
	}
	if (!['http:', 'https:'].includes(u.protocol) || !u.hostname.includes('.')) return { error: 'Link harus diawali https:// dan berupa alamat web.' };
	if (!platform) return {};

	const p = platformOfUrl(u);
	if (!p) return { warning: `Link ini bukan dari ${PLATFORMS[platform].label}. Pastikan link yang ditempel benar.` };
	if (p !== platform) return { error: `Link ini dari ${PLATFORMS[p].label}, tapi akun yang dipilih ${PLATFORMS[platform].label}. Pilih akun ${PLATFORMS[p].label} yang sesuai.` };
	const inUrl = usernameInUrl(u, platform);
	if (inUrl && username && inUrl.toLowerCase() !== username.toLowerCase())
		return { warning: `Username di link (@${inUrl}) berbeda dengan akun yang dipilih (@${username}). Pastikan ini postingan dari akun tersebut.` };
	return {};
}

/** Rapikan link: buang parameter pelacak (?igsh=, ?s=20, ?mdxt=, …) tanpa mengubah tujuan link */
export function cleanRecapUrl(raw) {
	let u;
	try {
		u = new URL(withScheme(raw));
	} catch {
		return raw;
	}
	const p = platformOfUrl(u);
	if (p === 'youtube') {
		for (const k of [...u.searchParams.keys()]) if (!['v', 'lc', 't'].includes(k)) u.searchParams.delete(k);
	} else if (p === 'facebook') {
		for (const k of [...u.searchParams.keys()]) if (!['story_fbid', 'fbid', 'id', 'v', 'comment_id'].includes(k)) u.searchParams.delete(k);
	} else if (p) u.search = '';
	u.hash = '';
	return u.toString();
}

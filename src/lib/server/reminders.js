// Notifikasi otomatis dari sistem: pengingat rekap & pengumuman massal.
// Semua query idempoten (cek NOT EXISTS), jadi aman dijalankan berulang kali.
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { TZ } from '#lib/constants.js';

/** Jam (WIB) mulai mengirim pengingat "belum ada rekap hari ini" */
export const DAILY_REMINDER_HOUR = 19;
/** Pengingat "tidak aktif" dikirim bila tidak ada rekap selama N hari (maks. sekali tiap N hari) */
export const INACTIVE_DAYS = 3;

// user yang bisa membuat rekap: user biasa, disetujui, punya minimal 1 akun disetujui
const CAN_RECAP = sql`u.status = 'approved' AND u.role = 'user'
	AND EXISTS (SELECT 1 FROM social_accounts a WHERE a.user_id = u.id AND a.status = 'approved')`;

const wibHour = () => Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date())) % 24;

/** Jalankan pengingat yang sudah waktunya. Hasil: jumlah notifikasi per jenis. */
export async function runReminders() {
	const out = { daily: 0, inactive: 0 };
	const todayStart = sql`(date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ})`;

	// 1. belum ada rekap hari ini — untuk user yang masih aktif (merekap dalam N hari terakhir)
	if (wibHour() >= DAILY_REMINDER_HOUR) {
		const r = await db.execute(sql`
			INSERT INTO notifications (user_id, type, title, body, link)
			SELECT u.id, 'reminder_daily', 'Belum ada rekap hari ini',
				'Jangan lupa catat postingan atau panel Anda hari ini sebelum berganti hari.', '/app/recaps/new'
			FROM users u
			WHERE ${CAN_RECAP}
				AND EXISTS (SELECT 1 FROM active_recaps r WHERE r.user_id = u.id AND r.posted_at >= now() - make_interval(days => ${INACTIVE_DAYS}))
				AND NOT EXISTS (SELECT 1 FROM active_recaps r WHERE r.user_id = u.id AND r.posted_at >= ${todayStart})
				AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'reminder_daily' AND n.created_at >= ${todayStart})`);
		out.daily = r.count ?? 0;
	}

	// 2. tidak aktif N hari — maksimal sekali tiap N hari per user
	const r2 = await db.execute(sql`
		INSERT INTO notifications (user_id, type, title, body, link)
		SELECT u.id, 'reminder_inactive', ${`Sudah ${INACTIVE_DAYS} hari tanpa rekap`},
			'Ayo lanjutkan aktivitas Anda — catat postingan atau panel terbaru di Retwepo.', '/app/recaps/new'
		FROM users u
		WHERE ${CAN_RECAP}
			AND coalesce(u.reviewed_at, u.created_at) < now() - make_interval(days => ${INACTIVE_DAYS})
			AND NOT EXISTS (SELECT 1 FROM active_recaps r WHERE r.user_id = u.id AND r.posted_at >= now() - make_interval(days => ${INACTIVE_DAYS}))
			AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'reminder_inactive' AND n.created_at >= now() - make_interval(days => ${INACTIVE_DAYS}))`);
	out.inactive = r2.count ?? 0;
	return out;
}

/**
 * Kirim satu notifikasi ke semua user terverifikasi (role user).
 * Hasil: jumlah penerima.
 */
export async function notifyAllUsers({ type, title, body = null, link = null }, tx = db) {
	const r = await tx.execute(sql`
		INSERT INTO notifications (user_id, type, title, body, link)
		SELECT u.id, ${type}, ${title}, ${body}, ${link} FROM users u WHERE u.status = 'approved' AND u.role = 'user'`);
	return r.count ?? 0;
}

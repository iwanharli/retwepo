import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { mismatchedUsername, PLATFORMS } from '#lib/constants.js';
import { notify } from './notify.js';

/**
 * Bila link rekap memakai username yang berbeda dari akunnya, sarankan user mengajukan ganti username.
 * Maksimal sekali per 7 hari per akun; dilewati bila sudah ada pengajuan ganti username.
 */
export async function suggestUsernameUpdate(account, url) {
	try {
		const suggested = url ? mismatchedUsername(url, account) : null;
		if (!suggested || account.pendingUsername) return;
		const link = `/app/accounts?saran=${account.id}`;
		const [recent] = await db.execute(sql`
			SELECT 1 FROM notifications WHERE user_id = ${account.userId} AND type = 'username_suggestion' AND link = ${link}
				AND created_at >= now() - interval '7 days' LIMIT 1`);
		if (recent) return;
		await notify({
			userId: account.userId,
			type: 'username_suggestion',
			title: `Username ${PLATFORMS[account.platform].label} mungkin perlu diperbarui`,
			body: `Link rekap Anda memakai @${suggested}, sedangkan akun terdaftar @${account.username}. Jika username Anda berubah atau salah ketik saat mendaftar, ajukan ganti username.`,
			link
		});
	} catch (e) {
		console.warn('[saran username] gagal:', e?.message);
	}
}

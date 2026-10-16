import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { recaps, users, socialAccounts } from './db/schema.js';
import { logAdmin } from './audit.js';
import { notify } from './notify.js';
import { PLATFORMS, fmtDate } from '#lib/constants.js';

async function loadRecap(id) {
	const [info] = await db
		.select({ r: recaps, username: socialAccounts.username, platform: socialAccounts.platform, nickname: users.nickname, email: users.email })
		.from(recaps)
		.innerJoin(socialAccounts, eq(socialAccounts.id, recaps.socialAccountId))
		.innerJoin(users, eq(users.id, recaps.userId))
		.where(eq(recaps.id, id));
	return info;
}

const label = (i) => `${PLATFORMS[i.platform].label} @${i.username} · ${fmtDate(i.r.postedAt, true)}`;

/**
 * Hapus rekap oleh admin (soft delete): data & screenshot tetap disimpan agar user bisa melihat
 * rekap mana yang dihapus dan alasannya, serta bisa dipulihkan. Alasan opsional; dicatat di log & dikirim ke user.
 */
export async function deleteRecapAsAdmin(admin, id, note) {
	note = note?.trim().slice(0, 500) || null;
	const info = await loadRecap(id);
	if (!info) return { error: fail(404, { error: 'Rekap tidak ditemukan' }) };
	if (info.r.deletedAt) return { error: fail(400, { error: 'Rekap ini sudah dihapus' }) };

	await db.transaction(async (tx) => {
		await tx.update(recaps).set({ deletedAt: new Date(), deletedBy: admin.id, deleteReason: note }).where(eq(recaps.id, id));
		await logAdmin(
			admin,
			{ action: 'deleteRecap', targetType: 'recap', targetId: id, targetLabel: `${label(info)} · oleh ${info.nickname ?? info.email}`, note, meta: { url: info.r.url } },
			tx
		);
		await notify(
			{
				userId: info.r.userId,
				type: 'recap_deleted',
				title: `Rekap ${PLATFORMS[info.platform].label} @${info.username} dihapus admin`,
				body: note ? `Alasan: ${note}` : 'Tidak ada alasan yang diberikan.',
				link: `/app/recaps/${id}`
			},
			tx
		);
	});
	return { ok: true };
}

/** Pulihkan rekap yang dihapus admin */
export async function restoreRecapAsAdmin(admin, id) {
	const info = await loadRecap(id);
	if (!info) return { error: fail(404, { error: 'Rekap tidak ditemukan' }) };
	if (!info.r.deletedAt) return { error: fail(400, { error: 'Rekap ini tidak dalam status dihapus' }) };

	await db.transaction(async (tx) => {
		await tx.update(recaps).set({ deletedAt: null, deletedBy: null, deleteReason: null }).where(eq(recaps.id, id));
		await logAdmin(admin, { action: 'restoreRecap', targetType: 'recap', targetId: id, targetLabel: `${label(info)} · oleh ${info.nickname ?? info.email}`, meta: { previousReason: info.r.deleteReason } }, tx);
		await notify(
			{
				userId: info.r.userId,
				type: 'recap_restored',
				title: `Rekap ${PLATFORMS[info.platform].label} @${info.username} dipulihkan`,
				body: 'Rekap kembali dihitung seperti semula.',
				link: `/app/recaps/${id}`
			},
			tx
		);
	});
	return { ok: true };
}

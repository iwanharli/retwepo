import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, asc, or } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recaps, recapEdits, socialAccounts } from '#lib/server/db/schema.js';
import { saveScreenshot, deleteScreenshot } from '#lib/server/uploads.js';
import { parseRecapForm } from '#lib/server/recap-form.js';

async function ownRecap(id, userId) {
	const [r] = await db
		.select()
		.from(recaps)
		.where(and(eq(recaps.id, Number(id) || 0), eq(recaps.userId, userId)));
	if (!r) error(404, 'Rekap tidak ditemukan');
	// rekap yang dihapus admin tidak bisa diedit
	if (r.deletedAt) redirect(303, `/app/recaps/${r.id}`);
	return r;
}

/** Waktu posting dalam format input datetime-local (WIB) */
const toLocal = (d) => new Date(new Date(d).getTime() + 7 * 3600000).toISOString().slice(0, 16);

export async function load({ params, locals }) {
	const r = await ownRecap(params.id, locals.user.id);
	const accounts = await db
		.select({ id: socialAccounts.id, platform: socialAccounts.platform, username: socialAccounts.username })
		.from(socialAccounts)
		.where(and(eq(socialAccounts.userId, locals.user.id), or(eq(socialAccounts.status, 'approved'), eq(socialAccounts.id, r.socialAccountId))))
		.orderBy(asc(socialAccounts.platform), asc(socialAccounts.username));

	return {
		accounts,
		recap: {
			id: r.id,
			createdAt: r.createdAt,
			editedAt: r.editedAt,
			initial: {
				accountId: r.socialAccountId,
				type: r.type,
				url: r.url,
				targetUrl: r.targetUrl,
				note: r.note,
				postedAt: toLocal(r.postedAt),
				screenshotPath: r.screenshotPath
			}
		}
	};
}

// kolom yang dibandingkan & disimpan di riwayat edit
const snapshot = (r) => ({
	socialAccountId: r.socialAccountId,
	type: r.type,
	url: r.url,
	targetUrl: r.targetUrl,
	note: r.note,
	postedAt: new Date(r.postedAt).toISOString(),
	screenshotPath: r.screenshotPath
});

export const actions = {
	default: async ({ request, params, locals }) => {
		const r = await ownRecap(params.id, locals.user.id);
		const form = await request.formData();
		const keep = { accountId: Number(form.get('accountId')), type: String(form.get('type')) };
		const removeOld = form.get('removeScreenshot') === '1';
		const reason = String(form.get('editReason') ?? '').trim().slice(0, 500);
		if (reason.length < 5) return fail(400, { error: 'Alasan perubahan wajib diisi (minimal 5 karakter)', keep });

		const parsed = await parseRecapForm(form, locals.user, { hasExistingShot: Boolean(r.screenshotPath) && !removeOld });
		if (parsed.error) return fail(400, { error: parsed.error, keep });

		let screenshotPath = removeOld ? null : r.screenshotPath;
		let newShot = null;
		if (parsed.file) {
			try {
				newShot = screenshotPath = await saveScreenshot(parsed.file);
			} catch (e) {
				return fail(400, { error: e.message, keep });
			}
		}

		const before = snapshot(r);
		const after = snapshot({ ...parsed.values, screenshotPath });
		if (JSON.stringify(before) === JSON.stringify(after)) {
			await deleteScreenshot(newShot);
			return fail(400, { error: 'Tidak ada perubahan yang disimpan', keep });
		}

		try {
			await db.transaction(async (tx) => {
				await tx.update(recaps).set({ ...parsed.values, screenshotPath, editedAt: new Date() }).where(eq(recaps.id, r.id));
				await tx.insert(recapEdits).values({ recapId: r.id, userId: locals.user.id, reason, before, after });
			});
		} catch (e) {
			await deleteScreenshot(newShot);
			throw e;
		}
		// screenshot lama TIDAK dihapus: disimpan sebagai bukti di riwayat edit

		return { success: 'Perubahan rekap disimpan ✔', keep };
	}
};

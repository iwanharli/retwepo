import { fail } from '@sveltejs/kit';
import { and, eq, asc } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recaps, socialAccounts } from '#lib/server/db/schema.js';
import { saveScreenshot, deleteScreenshot } from '#lib/server/uploads.js';
import { missingProfile } from '#lib/server/profile.js';
import { parseRecapForm } from '#lib/server/recap-form.js';
import { checkLimits, waitText } from '#lib/server/ratelimit.js';

export async function load({ locals, url }) {
	const accounts = await db
		.select({ id: socialAccounts.id, platform: socialAccounts.platform, username: socialAccounts.username })
		.from(socialAccounts)
		.where(and(eq(socialAccounts.userId, locals.user.id), eq(socialAccounts.status, 'approved')))
		.orderBy(asc(socialAccounts.platform), asc(socialAccounts.username));
	return { accounts, missingProfile: missingProfile(locals.user), preselect: Number(url.searchParams.get('account')) || null };
}

export const actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const keep = { accountId: Number(form.get('accountId')), type: String(form.get('type')) };

		if (missingProfile(locals.user).length)
			return fail(400, { error: 'Lengkapi data profil (nama panggilan & e-wallet) sebelum membuat rekap', keep });

		const limit = checkLimits([
			[`recap:${locals.user.id}:10m`, 60, 10 * 60 * 1000],
			[`recap:${locals.user.id}:1d`, 500, 24 * 60 * 60 * 1000]
		]);
		if (!limit.ok) return fail(429, { error: `Terlalu banyak rekap dalam waktu singkat. Coba lagi dalam ${waitText(limit.retryAfter)}.`, keep });

		const parsed = await parseRecapForm(form, locals.user);
		if (parsed.error) return fail(400, { error: parsed.error, keep });

		let screenshotPath = null;
		if (parsed.file) {
			try {
				screenshotPath = await saveScreenshot(parsed.file);
			} catch (e) {
				return fail(400, { error: e.message, keep });
			}
		}

		try {
			await db.insert(recaps).values({ ...parsed.values, userId: locals.user.id, screenshotPath });
		} catch (e) {
			await deleteScreenshot(screenshotPath);
			throw e;
		}

		return { success: 'Rekap berhasil disimpan ✔', keep };
	}
};

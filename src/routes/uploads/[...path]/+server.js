import fs from 'node:fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recaps, recapEdits } from '#lib/server/db/schema.js';
import { uploadRoot, readThumb } from '#lib/server/uploads.js';

export async function GET({ params, locals, url }) {
	const rel = params.path;
	if (!/^\d{4}\/\d{2}\/[0-9a-f-]+\.webp$/.test(rel)) error(404);

	// user biasa hanya boleh melihat screenshot miliknya sendiri
	if (locals.user.role !== 'admin') {
		const [own] = await db
			.select({ id: recaps.id })
			.from(recaps)
			.where(and(eq(recaps.screenshotPath, rel), eq(recaps.userId, locals.user.id)));
		if (!own) {
			// screenshot lama yang tersimpan di riwayat edit milik user ini
			const [old] = await db
				.select({ id: recapEdits.id })
				.from(recapEdits)
				.where(and(eq(recapEdits.userId, locals.user.id), sql`(${recapEdits.before} ->> 'screenshotPath' = ${rel} OR ${recapEdits.after} ->> 'screenshotPath' = ${rel})`))
				.limit(1);
			if (!old) error(404);
		}
	}

	try {
		// ?thumb → versi kecil untuk kartu (jauh lebih ringan); izin akses sama dengan gambar aslinya
		const file = url.searchParams.has('thumb') ? await readThumb(rel) : await fs.readFile(path.join(uploadRoot(), rel));
		return new Response(file, {
			headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=31536000, immutable' }
		});
	} catch {
		error(404);
	}
}

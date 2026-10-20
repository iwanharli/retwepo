// Pembersihan permanen rekap yang sudah lama dihapus admin.
// Modul ini sengaja tanpa import SvelteKit agar bisa dipakai server (hooks) maupun script CLI.
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {import('postgres').Sql} sql  klien postgres.js
 * @param {{ uploadDir: string, days: number, dryRun?: boolean }} opts
 * @returns {Promise<{ recaps: number, files: number, freedBytes: number }>}
 */
export async function purgeDeletedRecaps(sql, { uploadDir, days, dryRun = false }) {
	const old = await sql`
		SELECT r.id, r.screenshot_path,
			coalesce((SELECT json_agg(json_build_array(e.before ->> 'screenshotPath', e.after ->> 'screenshotPath'))
				FROM recap_edits e WHERE e.recap_id = r.id), '[]') AS edit_shots
		FROM recaps r
		WHERE r.deleted_at IS NOT NULL AND r.deleted_at < now() - make_interval(days => ${days})`;
	if (!old.length) return { recaps: 0, files: 0, freedBytes: 0 };

	const files = new Set();
	for (const r of old) {
		if (r.screenshot_path) files.add(r.screenshot_path);
		for (const pair of r.edit_shots) for (const f of pair) if (f) files.add(f);
	}

	// ukuran file yang akan dibebaskan (untuk laporan)
	let freedBytes = 0;
	for (const f of files) freedBytes += await fs.stat(path.join(uploadDir, f)).then((s) => s.size).catch(() => 0);

	if (dryRun) return { recaps: old.length, files: files.size, freedBytes };

	const ids = old.map((r) => r.id);
	await sql.begin(async (tx) => {
		await tx`DELETE FROM recaps WHERE id = ANY(${ids})`; // riwayat edit ikut terhapus (cascade)
		// JSON dikirim sebagai teks + ::jsonb (klien yang dipakai Drizzle tidak menserialisasi objek otomatis)
		await tx`
			INSERT INTO admin_logs (admin_id, action, target_type, target_label, note, meta)
			VALUES (NULL, 'purgeRecaps', 'recap', ${`${ids.length} rekap dihapus permanen`},
				${`Otomatis: dihapus admin lebih dari ${days} hari lalu`},
				${JSON.stringify({ ids, files: files.size, freedBytes })}::jsonb)`;
	});

	// file dihapus setelah data terhapus; file yang masih dipakai rekap lain tidak disentuh
	const stillUsed = new Set(
		(await sql`SELECT screenshot_path AS f FROM recaps WHERE screenshot_path = ANY(${[...files]})`).map((r) => r.f)
	);
	for (const f of files) {
		if (stillUsed.has(f)) continue;
		await fs.rm(path.join(uploadDir, f), { force: true });
		await fs.rm(path.join(uploadDir, f.replace(/\.webp$/, '.thumb.webp')), { force: true }); // thumbnail kartu
	}

	return { recaps: ids.length, files: files.size, freedBytes };
}

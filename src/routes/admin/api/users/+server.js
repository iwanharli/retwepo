import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';

// pencarian user terverifikasi untuk pemilih user (mis. modal "Tambah akun")
export async function GET({ url }) {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
	const rows = await db.execute(sql`
		SELECT u.id, u.nickname, u.email, u.avatar_url,
			(SELECT json_agg(json_build_object('platform', s.platform, 'username', s.username) ORDER BY s.created_at)
				FROM social_accounts s WHERE s.user_id = u.id AND s.status = 'approved') AS accounts
		FROM users u
		WHERE u.status = 'approved' AND (${q} = '' OR u.nickname ILIKE ${like} OR u.email ILIKE ${like})
		ORDER BY lower(coalesce(u.nickname, u.email))
		LIMIT 8`);
	return json([...rows]);
}

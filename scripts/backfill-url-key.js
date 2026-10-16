// Isi kolom url_key untuk rekap lama (sekali jalan; aman diulang).
// node --env-file=.env scripts/backfill-url-key.js
import postgres from 'postgres';
import { urlKey } from '../src/lib/constants.js';
const sql = postgres(process.env.DATABASE_URL);
const rows = await sql`SELECT id, url FROM recaps WHERE url IS NOT NULL`;
let n = 0;
for (const r of rows) {
	const k = urlKey(r.url);
	await sql`UPDATE recaps SET url_key = ${k} WHERE id = ${r.id}`;
	n++;
}
console.log(`url_key diisi untuk ${n} rekap`);
await sql.end();

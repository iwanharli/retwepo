import { sql } from 'drizzle-orm';

/** Kondisi SQL "AND <kolom> IN (platform…)"; kosong bila tidak ada platform dipilih */
export function platformCond(list, col = sql`a.platform`) {
	return list?.length ? sql`AND ${col}::text IN (${sql.join(list.map((p) => sql`${p}`), sql`, `)})` : sql``;
}

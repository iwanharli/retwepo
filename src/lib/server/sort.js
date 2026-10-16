import { sql } from 'drizzle-orm';

/**
 * Baca ?sort=<kolom>&dir=asc|desc.
 * columns: { key: { expr, dir } } — expr dipakai saat menyusun ORDER BY, dir = arah default kolom itu
 * def: { key, dir } — urutan bila tidak ada parameter
 */
export function parseSort(url, columns, def) {
	const p = url.searchParams;
	const key = columns[p.get('sort')] ? p.get('sort') : def.key;
	const fallback = key === def.key ? def.dir : (columns[key].dir ?? 'asc');
	const dir = ['asc', 'desc'].includes(p.get('dir')) ? p.get('dir') : fallback;
	return { key, dir };
}

/** ORDER BY untuk query SQL mentah; nilai kosong selalu di akhir */
export function orderSql(columns, { key, dir }) {
	return sql`${columns[key].expr} ${dir === 'asc' ? sql`ASC NULLS LAST` : sql`DESC NULLS LAST`}`;
}

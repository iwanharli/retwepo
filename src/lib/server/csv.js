/** sep: ',' (standar) atau ';' (Excel dengan setelan regional Indonesia) */
function cell(v, sep) {
	if (v === null || v === undefined) return '';
	const s = v instanceof Date ? v.toISOString() : String(v);
	return s.includes(sep) || /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV dengan BOM UTF-8 agar terbaca benar di Excel */
export function csvResponse(filename, header, rows, sep = ',') {
	const body = [header, ...rows].map((r) => r.map((v) => cell(v, sep)).join(sep)).join('\r\n');
	return new Response('﻿' + body, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="${filename}"`
		}
	});
}

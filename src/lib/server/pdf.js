import PDFDocument from 'pdfkit';
import { TZ } from '#lib/constants.js';

// Warna (selaras dengan tema aplikasi)
const C = { brand: '#4f46e5', brandDark: '#3730a3', ink: '#0f172a', muted: '#64748b', line: '#e2e8f0', zebra: '#f8fafc', head: '#1e293b' };
const M = 32; // margin halaman

// Font standar PDF hanya mendukung WinAnsi: karakter lain diganti agar tidak rusak
const SAFE = /[^\x20-\x7E\xA0-\xFF–—‘’“”…•€]/g;
const clean = (v) => (v === null || v === undefined ? '' : String(v).replace(/[\r\n\t]+/g, ' ').replace(SAFE, '?'));
// angka = rata kanan; deret digit berawalan 0 (nomor HP / e-wallet) tetap teks
const isNum = (v) => typeof v === 'number' || (typeof v === 'string' && /^-?\d+([.,]\d+)?$/.test(v.trim()) && !/^0\d/.test(v.trim()));

/**
 * Tabel ke PDF A4 landscape: kop berwarna, ringkasan filter, tabel berzebra dengan header berulang, nomor halaman.
 * meta: daftar keterangan filter (mis. ["Kampanye: #X", "Periode: …"])
 */
export function tablePdf({ title, meta = [], header, rows, note = null }) {
	const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: M, bufferPages: true, info: { Title: title, Author: 'Retwepo' } });
	const W = doc.page.width - M * 2;
	const bottom = doc.page.height - M - 18;
	const created = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' }).format(new Date()) + ' WIB';

	// ---- ukuran kolom:
	// minimal = kata terpanjang (agar kata pendek seperti "Platform" tidak terpotong), lalu sisa lebar
	// dibagi proporsional ke kolom yang isinya panjang (URL, catatan, …)
	const fs = header.length > 10 ? 7 : header.length > 7 ? 7.5 : 8.5;
	const pad = 5;
	const sample = rows.slice(0, 300);
	const words = (t) => clean(t).split(/\s+/).filter(Boolean);
	const minW = [];
	const want = header.map((h, i) => {
		doc.font('Helvetica-Bold').fontSize(fs);
		let w = doc.widthOfString(clean(h)) + pad * 2;
		let m = Math.max(...words(h).map((x) => doc.widthOfString(x)), 0) + pad * 2;
		doc.font('Helvetica').fontSize(fs);
		for (const r of sample) {
			w = Math.max(w, Math.min(doc.widthOfString(clean(r[i])) + pad * 2, 260));
			for (const x of words(r[i])) m = Math.max(m, Math.min(doc.widthOfString(x) + pad * 2, 120));
		}
		minW.push(Math.max(m, 30));
		return Math.max(w, minW[i]);
	});
	const minSum = minW.reduce((a, b) => a + b, 0);
	let widths;
	if (minSum >= W) widths = minW.map((m) => (m / minSum) * W);
	else {
		const extra = want.map((w, i) => w - minW[i]);
		const extraSum = extra.reduce((a, b) => a + b, 0);
		const free = W - minSum;
		widths = minW.map((m, i) => m + (extraSum ? (extra[i] / extraSum) * free : free / header.length));
		// jangan beri kolom lebih lebar dari kebutuhannya bila semua sudah muat: sisa dibagi rata
		const over = widths.map((w, i) => Math.max(0, w - want[i]));
		const overSum = over.reduce((a, b) => a + b, 0);
		if (overSum) {
			widths = widths.map((w, i) => w - over[i]);
			const need = widths.map((w, i) => (want[i] > w ? 1 : 0));
			const n = need.reduce((a, b) => a + b, 0) || header.length;
			widths = widths.map((w, i) => w + (need[i] || n === header.length ? overSum / n : 0));
		}
	}
	const numeric = header.map((_, i) => sample.length > 0 && sample.every((r) => r[i] === '' || r[i] === null || r[i] === undefined || isNum(r[i])));

	// ---- kop halaman pertama
	doc.rect(0, 0, doc.page.width, 78).fill(C.brand);
	doc.rect(0, 74, doc.page.width, 4).fill(C.brandDark);
	doc.fillColor('#c7d2fe').font('Helvetica-Bold').fontSize(9).text('RETWEPO', M, 20, { characterSpacing: 1.5 });
	doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(clean(title), M, 34, { width: W - 200 });
	doc.fillColor('#e0e7ff').font('Helvetica').fontSize(8.5).text(`Dibuat ${created}`, M, 24, { width: W, align: 'right' });
	doc.text(`${rows.length.toLocaleString('id-ID')} baris data`, M, 38, { width: W, align: 'right' });

	// ringkasan filter sebagai "chip"
	let x = M;
	let y = 92;
	doc.fontSize(8);
	for (const m of meta.map(clean)) {
		const w = doc.widthOfString(m) + 14;
		if (x + w > M + W) ((x = M), (y += 20));
		doc.roundedRect(x, y, w, 15, 7.5).fill('#eef2ff');
		doc.fillColor(C.brandDark).text(m, x + 7, y + 4, { lineBreak: false });
		x += w + 6;
	}
	y += meta.length ? 26 : 4;
	if (note) {
		doc.fillColor(C.muted).fontSize(7.5).text(clean(note), M, y, { width: W });
		y += 14;
	}

	// ---- tabel
	const drawHeader = () => {
		doc.font('Helvetica-Bold').fontSize(fs);
		const h = Math.max(...header.map((t, i) => doc.heightOfString(clean(t), { width: widths[i] - pad * 2 }))) + pad * 2;
		doc.rect(M, y, W, h).fill(C.head);
		let cx = M;
		header.forEach((t, i) => {
			doc.fillColor('#ffffff').text(clean(t), cx + pad, y + pad, { width: widths[i] - pad * 2, align: numeric[i] ? 'right' : 'left' });
			cx += widths[i];
		});
		y += h;
		doc.font('Helvetica').fontSize(fs);
	};
	drawHeader();

	if (!rows.length) {
		doc.fillColor(C.muted).fontSize(10).text('Tidak ada data untuk filter ini.', M, y + 24, { width: W, align: 'center' });
	}
	rows.forEach((r, ri) => {
		const cells = header.map((_, i) => clean(r[i]));
		const h = Math.max(...cells.map((t, i) => doc.heightOfString(t || ' ', { width: widths[i] - pad * 2 }))) + pad * 2;
		if (y + h > bottom) {
			doc.addPage();
			y = M;
			drawHeader();
		}
		if (ri % 2 === 1) doc.rect(M, y, W, h).fill(C.zebra);
		doc.moveTo(M, y + h).lineTo(M + W, y + h).lineWidth(0.5).strokeColor(C.line).stroke();
		let cx = M;
		cells.forEach((t, i) => {
			doc.fillColor(C.ink).text(t, cx + pad, y + pad, { width: widths[i] - pad * 2, align: numeric[i] ? 'right' : 'left' });
			cx += widths[i];
		});
		y += h;
	});

	// ---- kaki halaman: judul & nomor halaman
	const range = doc.bufferedPageRange();
	for (let i = 0; i < range.count; i++) {
		doc.switchToPage(range.start + i);
		doc.page.margins.bottom = 0; // agar teks kaki tidak memicu halaman baru
		const fy = doc.page.height - M + 4;
		doc.moveTo(M, fy - 6).lineTo(M + W, fy - 6).lineWidth(0.5).strokeColor(C.line).stroke();
		doc.font('Helvetica').fontSize(7.5).fillColor(C.muted);
		doc.text(`Retwepo · ${clean(title)}`, M, fy, { width: W / 2, lineBreak: false });
		doc.text(`Halaman ${i + 1} dari ${range.count}`, M + W / 2, fy, { width: W / 2, align: 'right', lineBreak: false });
	}

	doc.end();
	return doc;
}

/** Ubah stream pdfkit menjadi Buffer */
export function pdfBuffer(doc) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		doc.on('data', (c) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
	});
}

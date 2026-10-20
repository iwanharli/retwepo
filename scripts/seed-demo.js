// Data contoh untuk mencoba dashboard. Semua user demo memakai email @demo.local
// Hapus dengan: node --env-file=.env scripts/seed-demo.js --clean
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

await sql`DELETE FROM users WHERE email LIKE '%@demo.local'`;
if (process.argv.includes('--clean')) {
	console.log('Data demo dihapus');
	await sql.end();
	process.exit(0);
}

const NAMES = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko', 'Kiki', 'Lina', 'Maya', 'Nanda', 'Oki', 'Putri', 'Rina', 'Sari', 'Tono', 'Umar', 'Vina', 'Wawan', 'Yuni', 'Zaki'];
const PLATFORMS = ['twitter', 'instagram', 'threads', 'youtube', 'facebook', 'tiktok'];
const PWEIGHT = [0.4, 0.25, 0.15, 0.08, 0.12];
const WALLETS = ['DANA', 'OVO', 'GoPay', 'ShopeePay'];
const HOST = { twitter: 'x.com', instagram: 'instagram.com', threads: 'threads.net', youtube: 'youtube.com', facebook: 'facebook.com', tiktok: 'tiktok.com' };

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const wpick = (a, w) => {
	let r = Math.random();
	for (let i = 0; i < a.length; i++) if ((r -= w[i]) <= 0) return a[i];
	return a.at(-1);
};

// Akun contoh dengan email tetap (dicantumkan di README) — sisanya acak
const FIXED = [
	{ name: 'User', status: 'approved' },
	{ name: 'Pending', status: 'pending' },
	{ name: 'Ditolak', status: 'rejected', note: 'Username akun tidak ditemukan' },
	{ name: 'Suspend', status: 'suspended', note: 'Melanggar ketentuan' }
];

const N = 80;
let recapCount = 0;
for (let i = 0; i < N; i++) {
	const fixed = FIXED[i];
	const name = fixed?.name ?? `${pick(NAMES)}${i + 1}`;
	const roll = Math.random();
	const status = fixed?.status ?? (roll < 0.75 ? 'approved' : roll < 0.87 ? 'pending' : roll < 0.94 ? 'rejected' : 'suspended');
	const regDaysAgo = fixed ? 60 : Math.floor(Math.random() * 84);
	const [u] = await sql`
		INSERT INTO users (email, nickname, ewallet_provider, ewallet_number, status, status_note, registered_at, created_at, reviewed_at)
		VALUES (${name.toLowerCase() + '@demo.local'}, ${name}, ${pick(WALLETS)}, ${'08' + String(Math.random()).slice(2, 12)},
			${status}, ${fixed?.note ?? null}, now() - ${regDaysAgo + ' days'}::interval, now() - ${regDaysAgo + ' days'}::interval,
			${status === 'pending' ? null : sql`now() - ${Math.max(0, regDaysAgo - 1) + ' days'}::interval`})
		RETURNING id`;

	// user contoh "approved" selalu punya 3 akun aktif & rajin rekap
	const nAcc = fixed?.status === 'approved' ? 3 : 1 + Math.floor(Math.random() * 3);
	const used = new Set();
	const accs = [];
	for (let j = 0; j < nAcc; j++) {
		const p = fixed?.status === 'approved' ? ['twitter', 'instagram', 'threads'][j] : wpick(PLATFORMS, PWEIGHT);
		if (used.has(p)) continue;
		used.add(p);
		const accStatus = fixed?.status === 'approved' ? 'approved' : status === 'approved' ? (Math.random() < 0.9 ? 'approved' : 'pending') : status === 'rejected' ? 'rejected' : 'pending';
		const [a] = await sql`
			INSERT INTO social_accounts (user_id, platform, username, status, created_at)
			VALUES (${u.id}, ${p}, ${name.toLowerCase() + '_' + p.slice(0, 2) + i}, ${status === 'suspended' ? 'approved' : accStatus},
				now() - ${regDaysAgo + ' days'}::interval)
			RETURNING id, platform, username, status`;
		accs.push(a);
	}

	const usable = accs.filter((a) => a.status === 'approved');
	if (!usable.length || !['approved', 'suspended'].includes(status)) continue;

	// tiap user punya tingkat keaktifan berbeda; sebagian berhenti aktif
	const perDay = fixed ? 3 : Math.random() < 0.15 ? 0 : Math.random() * 4;
	const stopDaysAgo = fixed ? 0 : Math.random() < 0.2 ? 7 + Math.floor(Math.random() * 30) : 0;
	const rows = [];
	for (let d = regDaysAgo; d >= stopDaysAgo; d--) {
		const n = Math.round(perDay * (0.3 + Math.random() * 1.4));
		for (let k = 0; k < n; k++) {
			const a = pick(usable);
			const hour = wpick([8, 10, 12, 15, 19, 21, 23], [0.1, 0.12, 0.18, 0.12, 0.22, 0.18, 0.08]) + Math.floor(Math.random() * 2);
			const t = new Date(Date.now() - d * 86400000);
			t.setUTCHours(hour - 7, Math.floor(Math.random() * 60));
			if (t > new Date()) continue;
			const type = Math.random() < 0.45 ? 'post' : 'reply';
			const id = String(Math.floor(Math.random() * 1e15));
			rows.push({
				user_id: u.id,
				social_account_id: a.id,
				type,
				url: `https://${HOST[a.platform]}/${a.username}/status/${id}`,
				target_url: type === 'reply' && Math.random() < 0.6 ? `https://${HOST[a.platform]}/someone/status/${id.slice(3)}` : null,
				note: Math.random() < 0.2 ? 'Konten kampanye mingguan' : null,
				posted_at: t,
				created_at: t
			});
		}
	}
	for (let s = 0; s < rows.length; s += 500) await sql`INSERT INTO recaps ${sql(rows.slice(s, s + 500))}`;
	recapCount += rows.length;
}

console.log(`Demo: ${N} user, ${recapCount} rekap dibuat`);
await sql.end();

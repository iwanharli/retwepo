import { and, eq, gte, lt, ilike, or, asc, desc, count, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { recaps, recapEdits, socialAccounts, users, campaigns } from './db/schema.js';
import { startOfDay, addDays, ymd } from './dates.js';
import { PLATFORMS } from '#lib/constants.js';
import { parseSort } from './sort.js';

export const PER_PAGE = 24;

/** Rentang default halaman Riwayat Rekap (user) */
export const RECAP_DEFAULT_DAYS = 7;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Bangun kondisi filter rekap dari query string.
 * `defaultDays`: kalau ?from/?to tidak ada sama sekali, pakai N hari terakhir.
 * Parameter yang ada tapi kosong (mis. ?from=) berarti tanpa batas tanggal.
 */
export function recapFilters(url, { userId = null, defaultDays = null } = {}) {
	// ?status=deleted → rekap yang dihapus admin; selain itu hanya rekap aktif
	const deleted = url.searchParams.get('status') === 'deleted';
	const p = url.searchParams;
	const useDefault = defaultDays && !p.has('from') && !p.has('to');
	const f = {
		account: Number(p.get('account')) || null,
		user: userId ?? (Number(p.get('user')) || null),
		platform: PLATFORMS[p.get('platform')] ? p.get('platform') : null,
		campaign: Number(p.get('campaign')) || null,
		type: ['post', 'reply'].includes(p.get('type')) ? p.get('type') : null,
		evidence: ['url', 'shot', 'dup'].includes(p.get('evidence')) ? p.get('evidence') : null,
		from: useDefault ? addDays(ymd(), -(defaultDays - 1)) : DATE_RE.test(p.get('from') ?? '') ? p.get('from') : null,
		to: useDefault ? ymd() : DATE_RE.test(p.get('to') ?? '') ? p.get('to') : null,
		q: (p.get('q') ?? '').trim().slice(0, 100),
		status: deleted ? 'deleted' : null
	};

	const where = [deleted ? isNotNull(recaps.deletedAt) : isNull(recaps.deletedAt)];
	if (f.user) where.push(eq(recaps.userId, f.user));
	if (f.account) where.push(eq(recaps.socialAccountId, f.account));
	if (f.platform) where.push(eq(socialAccounts.platform, f.platform));
	if (f.campaign) where.push(eq(recaps.campaignId, f.campaign));
	if (f.type) where.push(eq(recaps.type, f.type));
	if (f.evidence === 'url') where.push(isNotNull(recaps.url));
	if (f.evidence === 'shot') where.push(isNotNull(recaps.screenshotPath));
	if (f.evidence === 'dup')
		where.push(sql`EXISTS (SELECT 1 FROM active_recaps d WHERE d.url_key = ${recaps.urlKey} AND d.id <> ${recaps.id})`);
	if (f.from) where.push(gte(recaps.postedAt, startOfDay(f.from)));
	if (f.to) where.push(lt(recaps.postedAt, startOfDay(addDays(f.to, 1))));
	if (f.q) {
		const like = `%${f.q.replace(/[%_\\]/g, '\\$&')}%`;
		where.push(
			or(
				ilike(recaps.url, like),
				ilike(recaps.note, like),
				ilike(socialAccounts.username, like),
				ilike(users.nickname, like),
				ilike(users.email, like)
			)
		);
	}
	return { f, where: where.length ? and(...where) : undefined };
}

const columns = {
	id: recaps.id,
	type: recaps.type,
	url: recaps.url,
	targetUrl: recaps.targetUrl,
	screenshotPath: recaps.screenshotPath,
	note: recaps.note,
	postedAt: recaps.postedAt,
	createdAt: recaps.createdAt,
	editedAt: recaps.editedAt,
	deletedAt: recaps.deletedAt,
	deleteReason: recaps.deleteReason,
	// jumlah rekap aktif lain dengan URL yang sama
	dupCount: sql`(SELECT count(*)::int FROM active_recaps d WHERE d.url_key = ${recaps.urlKey} AND d.id <> ${recaps.id})`,
	campaignId: recaps.campaignId,
	campaign: campaigns.name,
	platform: socialAccounts.platform,
	username: socialAccounts.username,
	userId: users.id,
	nickname: users.nickname,
	email: users.email,
	ewalletProvider: users.ewalletProvider,
	ewalletNumber: users.ewalletNumber
};

function base(fields) {
	return db
		.select(fields)
		.from(recaps)
		.innerJoin(socialAccounts, eq(socialAccounts.id, recaps.socialAccountId))
		.innerJoin(users, eq(users.id, recaps.userId))
		.innerJoin(campaigns, eq(campaigns.id, recaps.campaignId));
}

// kolom tabel rekap yang bisa diurutkan
const RECAP_COLUMNS = {
	posted: { expr: recaps.postedAt, dir: 'desc' },
	account: { expr: socialAccounts.username, dir: 'asc' },
	user: { expr: sql`lower(coalesce(${users.nickname}, ${users.email}))`, dir: 'asc' },
	url: { expr: recaps.url, dir: 'asc' },
	note: { expr: recaps.note, dir: 'asc' }
};

/** Urutan rekap dari ?sort=&dir= (default: waktu posting terbaru) */
export function recapSort(url) {
	const sort = parseSort(url, RECAP_COLUMNS, { key: 'posted', dir: 'desc' });
	const col = RECAP_COLUMNS[sort.key].expr;
	const order = sort.dir === 'asc' ? sql`${col} ASC NULLS LAST` : sql`${col} DESC NULLS LAST`;
	return { ...sort, order: [order, desc(recaps.id)] };
}

export async function listRecaps(where, page = 1, perPage = PER_PAGE, order = [desc(recaps.postedAt), desc(recaps.id)]) {
	const [rows, [{ total }]] = await Promise.all([
		base(columns)
			.where(where)
			.orderBy(...order)
			.limit(perPage)
			.offset((page - 1) * perPage),
		base({ total: count() }).where(where)
	]);
	return { rows, total, page, perPage };
}

/** Semua baris (untuk export), dibatasi agar aman. */
export function allRecaps(where, limit = 100000) {
	return base(columns).where(where).orderBy(desc(recaps.postedAt), desc(recaps.id)).limit(limit);
}

export function pageNum(url) {
	return Math.max(1, Number(url.searchParams.get('page')) || 1);
}

/** Ringkasan rekap per user (untuk export laporan / pembayaran). */
export function recapSummaryByUser(where) {
	return base({
		userId: users.id,
		nickname: users.nickname,
		email: users.email,
		ewalletProvider: users.ewalletProvider,
		ewalletNumber: users.ewalletNumber,
		total: sql`count(*)::int`,
		posts: sql`count(*) FILTER (WHERE ${recaps.type} = 'post')::int`,
		replies: sql`count(*) FILTER (WHERE ${recaps.type} = 'reply')::int`,
		accounts: sql`count(DISTINCT ${recaps.socialAccountId})::int`,
		activeDays: sql`count(DISTINCT (${recaps.postedAt} AT TIME ZONE 'Asia/Jakarta')::date)::int`,
		firstAt: sql`min(${recaps.postedAt})`,
		lastAt: sql`max(${recaps.postedAt})`
	})
		.where(where)
		.groupBy(users.id)
		.orderBy(sql`count(*) DESC`);
}

/** Satu rekap lengkap untuk halaman detail. userId: batasi ke rekap milik user tersebut. */
export async function getRecap(id, { userId = null } = {}) {
	const cond = [eq(recaps.id, Number(id) || 0)];
	if (userId) cond.push(eq(recaps.userId, userId));
	const [row] = await base({
		...columns,
		accountId: socialAccounts.id,
		accountStatus: socialAccounts.status,
		avatarUrl: users.avatarUrl,
		userStatus: users.status,
		deletedBy: recaps.deletedBy
	}).where(and(...cond));
	if (row?.deletedBy) {
		const [by] = await db.select({ nickname: users.nickname, email: users.email }).from(users).where(eq(users.id, row.deletedBy));
		row.deletedByName = by?.nickname ?? by?.email ?? 'Admin';
	}
	return row ?? null;
}

/** Riwayat edit satu rekap (terbaru dulu) + label akun untuk nilai socialAccountId */
export async function getRecapEdits(recapId) {
	const edits = await db.select().from(recapEdits).where(eq(recapEdits.recapId, recapId)).orderBy(desc(recapEdits.createdAt));
	const ids = [...new Set(edits.flatMap((e) => [e.before.socialAccountId, e.after.socialAccountId]))];
	const [accs, camps] = await Promise.all([
		ids.length
			? db.select({ id: socialAccounts.id, platform: socialAccounts.platform, username: socialAccounts.username }).from(socialAccounts).where(or(...ids.map((i) => eq(socialAccounts.id, i))))
			: [],
		db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns)
	]);
	return { edits, accounts: Object.fromEntries(accs.map((a) => [a.id, a])), campaigns: Object.fromEntries(camps.map((c) => [c.id, c.name])) };
}

/** Jumlah rekap aktif & terhapus (untuk tab Aktif / Dihapus) */
export async function recapStatusCounts(userId = null) {
	const cond = userId ? sql`WHERE user_id = ${userId}` : sql``;
	const [c] = await db.execute(sql`SELECT count(*) FILTER (WHERE deleted_at IS NULL)::int AS active,
		count(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS deleted FROM recaps ${cond}`);
	return c;
}

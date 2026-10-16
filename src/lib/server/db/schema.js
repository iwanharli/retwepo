import { sql } from 'drizzle-orm';
import {
	pgTable,
	pgEnum,
	serial,
	integer,
	text,
	varchar,
	timestamp,
	index,
	uniqueIndex,
	check,
	jsonb
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin']);

// incomplete = sudah login Google tapi belum isi form pendaftaran
export const userStatusEnum = pgEnum('user_status', [
	'incomplete',
	'pending',
	'approved',
	'rejected',
	'suspended'
]);

export const platformEnum = pgEnum('platform', [
	'twitter',
	'instagram',
	'threads',
	'youtube',
	'facebook'
]);

export const accountStatusEnum = pgEnum('account_status', ['pending', 'approved', 'rejected']);

export const recapTypeEnum = pgEnum('recap_type', ['post', 'reply']);

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		email: varchar('email', { length: 255 }).notNull().unique(),
		googleId: varchar('google_id', { length: 64 }).unique(),
		googleName: varchar('google_name', { length: 255 }),
		avatarUrl: text('avatar_url'),
		nickname: varchar('nickname', { length: 50 }),
		ewalletProvider: varchar('ewallet_provider', { length: 30 }),
		ewalletNumber: varchar('ewallet_number', { length: 30 }),
		// hasil cek nama pemilik e-wallet (lihat ewallet-check.js); berlaku selama ewallet_check_key = provider:nomor saat ini
		ewalletHolder: varchar('ewallet_holder', { length: 120 }),
		ewalletCheckStatus: varchar('ewallet_check_status', { length: 20 }), // found | not_found | unavailable
		ewalletCheckKey: varchar('ewallet_check_key', { length: 64 }),
		ewalletCheckedAt: timestamp('ewallet_checked_at', { withTimezone: true }),
		role: roleEnum('role').notNull().default('user'),
		status: userStatusEnum('status').notNull().default('incomplete'),
		statusNote: text('status_note'),
		reviewedBy: integer('reviewed_by'),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
		registeredAt: timestamp('registered_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('users_status_idx').on(t.status), index('users_registered_idx').on(t.registeredAt)]
);

export const sessions = pgTable(
	'sessions',
	{
		id: varchar('id', { length: 64 }).primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

export const socialAccounts = pgTable(
	'social_accounts',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		platform: platformEnum('platform').notNull(),
		// disimpan ternormalisasi: huruf kecil, tanpa '@', tanpa spasi
		username: varchar('username', { length: 100 }).notNull(),
		status: accountStatusEnum('status').notNull().default('pending'),
		statusNote: text('status_note'),
		reviewedBy: integer('reviewed_by'),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		// satu akun sosmed hanya boleh dimiliki satu user, kecuali yang sudah ditolak
		uniqueIndex('social_accounts_platform_username_uq')
			.on(t.platform, t.username)
			.where(sql`${t.status} <> 'rejected'`),
		index('social_accounts_user_idx').on(t.userId),
		index('social_accounts_status_idx').on(t.status)
	]
);

export const recaps = pgTable(
	'recaps',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		socialAccountId: integer('social_account_id')
			.notNull()
			.references(() => socialAccounts.id, { onDelete: 'cascade' }),
		type: recapTypeEnum('type').notNull(),
		url: text('url'),
		// URL ternormalisasi untuk mendeteksi rekap duplikat (lihat urlKey di constants.js)
		urlKey: text('url_key'),
		targetUrl: text('target_url'),
		screenshotPath: text('screenshot_path'),
		note: text('note'),
		postedAt: timestamp('posted_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		// diisi saat user mengedit rekap (null = belum pernah diedit)
		editedAt: timestamp('edited_at', { withTimezone: true }),
		// soft delete oleh admin: data & screenshot tetap disimpan, tidak dihitung di statistik
		deletedAt: timestamp('deleted_at', { withTimezone: true }),
		deletedBy: integer('deleted_by'),
		deleteReason: text('delete_reason')
	},
	(t) => [
		check('recaps_evidence_chk', sql`${t.url} IS NOT NULL OR ${t.screenshotPath} IS NOT NULL`),
		index('recaps_posted_idx').on(t.postedAt),
		index('recaps_user_posted_idx').on(t.userId, t.postedAt),
		index('recaps_account_idx').on(t.socialAccountId),
		index('recaps_deleted_idx').on(t.userId, t.deletedAt),
		index('recaps_url_key_idx').on(t.urlKey)
	]
);

// Riwayat edit rekap oleh user: alasan + nilai sebelum & sesudah
export const recapEdits = pgTable(
	'recap_edits',
	{
		id: serial('id').primaryKey(),
		recapId: integer('recap_id')
			.notNull()
			.references(() => recaps.id, { onDelete: 'cascade' }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		reason: text('reason').notNull(),
		before: jsonb('before').notNull(),
		after: jsonb('after').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('recap_edits_recap_idx').on(t.recapId, t.createdAt)]
);

// Log aktivitas admin (siapa melakukan apa, kapan, dan alasannya)
export const adminLogs = pgTable(
	'admin_logs',
	{
		id: serial('id').primaryKey(),
		adminId: integer('admin_id').references(() => users.id, { onDelete: 'set null' }),
		action: varchar('action', { length: 40 }).notNull(),
		targetType: varchar('target_type', { length: 20 }).notNull(), // user | account | recap
		targetId: integer('target_id'),
		targetLabel: text('target_label'), // disimpan agar tetap terbaca walau target dihapus
		note: text('note'),
		meta: jsonb('meta'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('admin_logs_created_idx').on(t.createdAt), index('admin_logs_target_idx').on(t.targetType, t.targetId)]
);

// Notifikasi untuk user (rekap dihapus, akun disetujui, dll.)
export const notifications = pgTable(
	'notifications',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: varchar('type', { length: 40 }).notNull(),
		title: text('title').notNull(),
		body: text('body'),
		link: text('link'),
		readAt: timestamp('read_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('notifications_user_idx').on(t.userId, t.createdAt)]
);

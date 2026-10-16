import { and, inArray, ne, or, eq, sql } from 'drizzle-orm';
import { socialAccounts } from './db/schema.js';
import { PLATFORMS, normalizeUsername } from '#lib/constants.js';

/**
 * Ambil daftar akun dari FormData (field "platform" & "username" berulang),
 * normalisasi, dan validasi format.
 * @returns {{ accounts: {platform:string, username:string}[], error?: string }}
 */
export function parseAccounts(form) {
	const platforms = form.getAll('platform').map(String);
	const usernames = form.getAll('username').map(String);
	const accounts = [];
	const seen = new Set();

	for (let i = 0; i < platforms.length; i++) {
		const platform = platforms[i];
		const username = normalizeUsername(usernames[i]);
		if (!username) continue;
		if (!PLATFORMS[platform]) return { accounts, error: 'Platform tidak valid' };
		if (!/^[a-z0-9._-]{1,100}$/.test(username))
			return { accounts, error: `Username "${usernames[i]}" tidak valid` };
		const key = `${platform}:${username}`;
		if (seen.has(key)) return { accounts, error: `Akun ${PLATFORMS[platform].label} @${username} diisi dua kali` };
		seen.add(key);
		accounts.push({ platform, username });
	}
	return { accounts };
}

/** Cek akun yang sudah dipakai (status pending/approved) oleh siapa pun. */
export async function findTaken(tx, accounts) {
	if (!accounts.length) return [];
	return tx
		.select({ platform: socialAccounts.platform, username: socialAccounts.username, userId: socialAccounts.userId })
		.from(socialAccounts)
		.where(
			and(
				ne(socialAccounts.status, 'rejected'),
				or(...accounts.map((a) => and(eq(socialAccounts.platform, a.platform), eq(socialAccounts.username, a.username))))
			)
		);
}

export function takenMessage(taken) {
	const list = taken.map((t) => `${PLATFORMS[t.platform].label} @${t.username}`).join(', ');
	return `Akun berikut sudah terdaftar dan tidak bisa digunakan: ${list}`;
}

export function isUniqueViolation(e) {
	return e?.code === '23505' || e?.cause?.code === '23505';
}

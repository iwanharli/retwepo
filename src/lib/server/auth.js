import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from './db/index.js';
import { sessions, users } from './db/schema.js';

const DAY_MS = 1000 * 60 * 60 * 24;
const SESSION_DAYS = 30;

export const SESSION_COOKIE = 'session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(20));
	return encodeBase32LowerCaseNoPadding(bytes);
}

/** Session id di DB adalah hash dari token cookie, jadi bocornya DB tidak membocorkan sesi. */
function tokenToId(token) {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(token, userId) {
	const session = {
		id: tokenToId(token),
		userId,
		expiresAt: new Date(Date.now() + DAY_MS * SESSION_DAYS)
	};
	await db.insert(sessions).values(session);
	return session;
}

export async function validateSessionToken(token) {
	const id = tokenToId(token);
	const [row] = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, id));

	if (!row) return { session: null, user: null };
	const { session, user } = row;

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, id));
		return { session: null, user: null };
	}

	// perpanjang otomatis kalau sisa < 15 hari
	if (Date.now() >= session.expiresAt.getTime() - DAY_MS * 15) {
		session.expiresAt = new Date(Date.now() + DAY_MS * SESSION_DAYS);
		await db.update(sessions).set({ expiresAt: session.expiresAt }).where(eq(sessions.id, id));
	}

	return { session, user };
}

export async function invalidateSession(sessionId) {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateUserSessions(userId) {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function setSessionCookie(event, token, expiresAt) {
	event.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionCookie(event) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Login user (buat sesi + cookie). */
export async function signIn(event, userId) {
	const token = generateSessionToken();
	const session = await createSession(token, userId);
	setSessionCookie(event, token, session.expiresAt);
}

/** Tujuan setelah login berdasarkan status user. */
export function homeFor(user) {
	if (!user) return '/login';
	if (user.status === 'incomplete') return '/register';
	if (user.role === 'admin' && user.status === 'approved') return '/admin';
	if (user.status === 'approved') return '/app';
	return '/pending';
}

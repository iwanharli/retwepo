import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { socialAccounts } from '#lib/server/db/schema.js';

export async function load({ locals }) {
	const accounts = await db.select().from(socialAccounts).where(eq(socialAccounts.userId, locals.user.id));
	const { email, nickname, status, statusNote } = locals.user;
	return { me: { email, nickname, status, statusNote }, accounts };
}

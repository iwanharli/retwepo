// Membuat / menaikkan akun admin pertama dari ADMIN_EMAIL.
import postgres from 'postgres';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!email) throw new Error('ADMIN_EMAIL belum diset di .env');

const sql = postgres(process.env.DATABASE_URL);
const [u] = await sql`
	INSERT INTO users (email, nickname, role, status, registered_at, reviewed_at)
	VALUES (${email}, 'Admin', 'admin', 'approved', now(), now())
	ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'approved'
	RETURNING id, email, role, status`;
console.log('Admin siap:', u);
await sql.end();

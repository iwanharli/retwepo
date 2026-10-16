import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$app/env/private';
import * as schema from './schema.js';

// Simpan koneksi di globalThis: saat dev, modul ini dimuat ulang setiap kali kode berubah (HMR).
// Tanpa ini, setiap reload membuat pool baru dan koneksi lama tidak pernah ditutup
// sampai PostgreSQL menolak dengan "too many clients".
const client = (globalThis.__retwepoPg ??= postgres(DATABASE_URL, { max: 10, idle_timeout: 30 }));

export const db = drizzle(client, { schema });
export { schema };

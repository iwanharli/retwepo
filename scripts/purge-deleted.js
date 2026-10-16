// Bersihkan permanen rekap yang dihapus admin lebih dari N hari (default sesuai DELETED_RETENTION_DAYS).
// Pemakaian: node --env-file=.env scripts/purge-deleted.js [--dry-run] [--days=90]
import postgres from 'postgres';
import path from 'node:path';
import { purgeDeletedRecaps } from '../src/lib/server/purge-core.js';
import { DELETED_RETENTION_DAYS } from '../src/lib/constants.js';

const dryRun = process.argv.includes('--dry-run');
const days = Number(process.argv.find((a) => a.startsWith('--days='))?.split('=')[1]) || DELETED_RETENTION_DAYS;
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');

const sql = postgres(process.env.DATABASE_URL);
const res = await purgeDeletedRecaps(sql, { uploadDir, days, dryRun });
console.log(
	`${dryRun ? '[simulasi] akan dibersihkan' : 'Dibersihkan'}: ${res.recaps} rekap, ${res.files} file screenshot, ${(res.freedBytes / 1024 / 1024).toFixed(2)} MB (dihapus admin > ${days} hari)`
);
await sql.end();

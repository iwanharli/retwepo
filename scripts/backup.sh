#!/usr/bin/env bash
# Backup database + folder screenshot ke ./backups (atau BACKUP_DIR), simpan KEEP_DAYS hari terakhir.
# Pemakaian: ./run.sh backup   |   jadwal harian (crontab -e):
#   0 2 * * * cd /path/ke/retwepo && ./run.sh backup >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

set -a; source .env; set +a
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

command -v pg_dump >/dev/null || fail_msg="pg_dump tidak ditemukan (pasang PostgreSQL client / Postgres.app)"
[ -z "${fail_msg:-}" ] || { echo "✗ $fail_msg" >&2; exit 1; }

# 1. database (format custom: terkompresi, bisa dipulihkan sebagian)
DB_FILE="$BACKUP_DIR/db-$STAMP.dump"
pg_dump --format=custom --no-owner --file="$DB_FILE" "$DATABASE_URL"

# 2. screenshot
UP_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"
tar -czf "$UP_FILE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

# 3. hapus backup lama
find "$BACKUP_DIR" -maxdepth 1 \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -print -delete | sed 's/^/  dihapus (lama): /'

echo "✓ backup $STAMP — database $(du -h "$DB_FILE" | cut -f1), screenshot $(du -h "$UP_FILE" | cut -f1) → $BACKUP_DIR"

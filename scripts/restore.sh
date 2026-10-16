#!/usr/bin/env bash
# Pulihkan backup: ./run.sh restore backups/db-YYYYMMDD-HHMMSS.dump [backups/uploads-YYYYMMDD-HHMMSS.tar.gz]
# PERINGATAN: menimpa isi database & folder screenshot saat ini.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
DB_FILE="${1:?Sebutkan file db-*.dump}"
UP_FILE="${2:-}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"

read -r -p "Database & screenshot saat ini akan DITIMPA dari backup. Ketik 'pulihkan' untuk lanjut: " ok
[ "$ok" = "pulihkan" ] || { echo "Dibatalkan."; exit 1; }

pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$DB_FILE"
echo "✓ database dipulihkan dari $DB_FILE"
if [ -n "$UP_FILE" ]; then
	rm -rf "$UPLOAD_DIR" && mkdir -p "$(dirname "$UPLOAD_DIR")"
	tar -xzf "$UP_FILE" -C "$(dirname "$UPLOAD_DIR")"
	echo "✓ screenshot dipulihkan dari $UP_FILE"
fi

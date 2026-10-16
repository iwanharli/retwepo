#!/usr/bin/env bash
# Retwepo launcher
#   ./run.sh          → mode development (http://localhost:5180)
#   ./run.sh prod     → build lalu jalankan versi produksi
#   ./run.sh seed     → buat/naikkan admin dari ADMIN_EMAIL
#   ./run.sh demo     → isi data demo (80 user + rekap)
#   ./run.sh clean    → hapus data demo
#   ./run.sh purge    → bersihkan permanen rekap yang dihapus admin > 90 hari (--dry-run untuk simulasi)
set -euo pipefail
cd "$(dirname "$0")"

PORT=5180
MODE="${1:-dev}"

info() { printf '\033[1;34m▸\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

[ -f .env ] || fail ".env belum ada. Salin dulu: cp .env.example .env"
command -v node >/dev/null || fail "Node.js belum terpasang"

if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
	info "Memasang dependency…"
	npm install
fi

info "Cek koneksi database…"
node --env-file=.env -e "
	const sql = require('postgres')(process.env.DATABASE_URL, { connect_timeout: 5 });
	sql\`select 1\`.then(() => sql.end()).catch((e) => { console.error(e.message); process.exit(1); });
" || fail "Database tidak bisa diakses. Pastikan PostgreSQL (Postgres.app) sudah jalan dan DATABASE_URL benar."

info "Menjalankan migrasi…"
npx drizzle-kit migrate >/dev/null

free_port() {
	local pids
	pids=$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
	if [ -n "$pids" ]; then
		info "Port $PORT dipakai proses lain, menghentikannya…"
		kill $pids 2>/dev/null || true
		sleep 1
	fi
}

case "$MODE" in
	dev)
		free_port
		info "Dev server → http://localhost:$PORT"
		exec npm run dev
		;;
	prod)
		info "Build produksi…"
		npm run build
		free_port
		info "Server produksi → http://localhost:$PORT"
		PORT=$PORT exec node --env-file=.env build
		;;
	seed)  npm run db:seed ;;
	demo)  npm run db:seed-demo ;;
	clean) node --env-file=.env scripts/seed-demo.js --clean ;;
	purge) node --env-file=.env scripts/purge-deleted.js "${@:2}" ;;
	*) fail "Mode tidak dikenal: $MODE (pakai: dev | prod | seed | demo | clean | purge)" ;;
esac

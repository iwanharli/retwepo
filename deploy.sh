#!/usr/bin/env bash
# Deploy Retwepo ke server produksi dengan satu perintah.
#   ./deploy.sh            → push ke GitHub, lalu update server (backup → pull → install → migrasi → build → restart → cek)
#   ./deploy.sh --dry-run  → hanya tampilkan apa yang akan dideploy
#
# Pengaturan dibaca dari .deploy.env (tidak ikut git), contoh:
#   DEPLOY_HOST=root@1.2.3.4
#   DEPLOY_DIR=/var/www/_otherproject/retwepo
#   DEPLOY_PM2=retwepo-3510
#   DEPLOY_URL=https://retwepo.kecup.in
#   DEPLOY_SSHPASS=...        # opsional; kosongkan bila memakai SSH key
set -euo pipefail
cd "$(dirname "$0")"

info() { printf '\033[1;34m▸\033[0m %s\n' "$*"; }
ok() { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

[ -f .deploy.env ] || fail "Buat file .deploy.env dulu (lihat contoh di bagian atas deploy.sh)"
set -a; . ./.deploy.env; set +a
: "${DEPLOY_HOST:?DEPLOY_HOST belum diisi}" "${DEPLOY_DIR:?}" "${DEPLOY_PM2:?}" "${DEPLOY_URL:?}"

# ssh dengan password (sshpass) atau SSH key
remote() {
	if [ -n "${DEPLOY_SSHPASS:-}" ]; then
		command -v sshpass >/dev/null || fail "sshpass belum terpasang (brew install sshpass) atau pakai SSH key"
		SSHPASS="$DEPLOY_SSHPASS" sshpass -e ssh -o ConnectTimeout=15 "$DEPLOY_HOST" "$@"
	else
		ssh -o ConnectTimeout=15 "$DEPLOY_HOST" "$@"
	fi
}

# 1. pastikan kode lokal sudah di-commit
[ -z "$(git status --porcelain)" ] || fail "Ada perubahan yang belum di-commit. Commit dulu sebelum deploy."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "main" ] || fail "Deploy hanya dari branch main (sekarang: $BRANCH)"

SERVER_REV=$(remote "cd $DEPLOY_DIR && git rev-parse --short HEAD")
LOCAL_REV=$(git rev-parse --short HEAD)
info "Server: $SERVER_REV → lokal: $LOCAL_REV"
if [ "$SERVER_REV" = "$LOCAL_REV" ]; then ok "Server sudah versi terbaru, tidak ada yang dideploy."; exit 0; fi
git --no-pager log --oneline "$SERVER_REV..$LOCAL_REV" | sed 's/^/    /'

CHANGED=$(git diff --name-only "$SERVER_REV" "$LOCAL_REV")
NEED_INSTALL=$(echo "$CHANGED" | grep -qE '^package(-lock)?\.json$' && echo 1 || echo 0)
NEED_MIGRATE=$(echo "$CHANGED" | grep -q '^drizzle/' && echo 1 || echo 0)
info "Install dependency: $([ $NEED_INSTALL = 1 ] && echo ya || echo tidak) · migrasi database: $([ $NEED_MIGRATE = 1 ] && echo ya || echo tidak)"
[ "${1:-}" = "--dry-run" ] && { ok "Simulasi selesai, tidak ada yang diubah."; exit 0; }

# 2. kirim ke GitHub
info "Push ke GitHub…"
git push -q origin main

# 3. update server; bila cek kesehatan gagal, kembali ke versi sebelumnya
info "Update server…"
remote "bash -s" <<REMOTE
set -euo pipefail
cd "$DEPLOY_DIR"
PREV=\$(git rev-parse HEAD)

rebuild() {
	if [ "$NEED_INSTALL" = 1 ]; then npm ci --no-audit --no-fund >/dev/null 2>&1; fi
	npm run build >/dev/null 2>&1
	pm2 restart "$DEPLOY_PM2" --update-env >/dev/null
}
healthy() {
	for i in 1 2 3 4 5 6 7 8 9 10; do
		code=\$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:\$(grep '^PORT=' .env | cut -d= -f2)/login" || true)
		[ "\$code" = "200" ] && return 0
		sleep 2
	done
	return 1
}

if [ "$NEED_MIGRATE" = 1 ]; then
	./scripts/backup.sh | tail -1
fi
git pull -q origin main
echo "  versi: \$(git log --oneline -1)"
if [ "$NEED_MIGRATE" = 1 ]; then npx drizzle-kit migrate 2>&1 | tail -1; fi
rebuild
if healthy; then
	echo "  ✓ aplikasi sehat"
else
	echo "  ✗ aplikasi tidak merespons — kembali ke versi sebelumnya" >&2
	git reset -q --hard "\$PREV"
	rebuild
	healthy && echo "  ↩ versi sebelumnya berjalan lagi (\$(git log --oneline -1))" >&2
	echo "  Catatan: migrasi database (bila ada) tidak dibatalkan otomatis; backup tersedia di backups/." >&2
	exit 1
fi
REMOTE

code=$(curl -s -o /dev/null -w '%{http_code}' "$DEPLOY_URL/login")
[ "$code" = "200" ] && ok "Deploy selesai → $DEPLOY_URL" || fail "Server berjalan, tapi $DEPLOY_URL/login mengembalikan $code"

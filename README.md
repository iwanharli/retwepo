# Retwepo — Rekap Postingan & Panel Media Sosial

Aplikasi web untuk mencatat (merekap) postingan dan panel yang dibuat user di akun media sosial mereka
(X/Twitter, Instagram, Threads, YouTube, Facebook, TikTok), lengkap dengan bukti URL/screenshot, verifikasi admin,
statistik, dan export untuk keperluan pembayaran.

**Stack:** SvelteKit 3 · Svelte 5 · PostgreSQL + Drizzle ORM · Google OAuth (Arctic) · Tailwind CSS 4 ·
Bits UI · Lucide · ECharts · Sharp

---

## Fitur

### User
- Masuk dengan Google, isi form pendaftaran (nama panggilan, e-wallet + konfirmasi nomor, akun sosmed) → menunggu verifikasi admin
- Dashboard: ringkasan rekap, grafik 30 hari, komposisi postingan/panel, performa per akun, peringatan bila belum bisa merekap
- Tambah rekap: pilih akun, tipe postingan/panel (reply, like, retweet, share), URL dan/atau screenshot (tempel langsung dengan Ctrl/⌘+V), waktu posting, catatan
- Riwayat rekap: default 7 hari terakhir, infinite scroll, tampilan grid/tabel, filter & urutkan kolom
- Detail rekap dengan lightbox screenshot; **edit** rekap wajib menyertakan alasan dan tersimpan sebagai riwayat perubahan
- Akun sosmed: ajukan akun baru (diverifikasi admin)
- Profil: ubah nama & e-wallet (perubahan e-wallet wajib dikonfirmasi ulang)
- Notifikasi: rekap dihapus/dipulihkan, akun disetujui/ditolak/dicabut, status akun

### Admin
- Statistik: KPI vs periode sebelumnya, tren per platform, distribusi platform, peringkat user & akun, heatmap jam aktif, user tidak aktif
- Semua rekap: tab aktif/dihapus, filter, export CSV dengan pengaturan (detail atau ringkasan per user untuk pembayaran)
- **Pengguna:** User Terverifikasi (tambah user/admin langsung terverifikasi), Akun Terverifikasi (tambah akun langsung terverifikasi, cabut verifikasi)
- **Verifikasi:** Pendaftaran User & Pengajuan Akun (setujui dengan tombol *Batalkan*, tolak wajib beralasan)
- Hapus rekap = *soft delete*: user melihat label & alasan, rekap bisa dipulihkan, dibersihkan permanen otomatis setelah 90 hari
- Edit profil user (nama & e-wallet, nomor baru wajib diketik ulang); user mendapat notifikasi
- Log Aktivitas: semua aksi admin (siapa, kapan, target, alasan)
- Semua tabel bisa diurutkan dengan klik judul kolom; export CSV user & akun sosmed dengan pengaturan
- **URL duplikat**: user diperingatkan saat mengisi URL yang sudah pernah direkap (link berbeda bentuk dikenali sama, mis. twitter.com = x.com); admin melihat label *Duplikat* dan filter "URL duplikat"
- Detail akun sosmed: statistik, grafik, riwayat verifikasi, dan rekap per akun
- Tampilan HP: tabel otomatis berubah menjadi kartu

---

## Menjalankan (development)

Kebutuhan: Node.js 22+, PostgreSQL 15+ (mis. Postgres.app).

```bash
cp .env.example .env        # isi DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, ADMIN_EMAIL
./run.sh                    # install, cek DB, migrasi, lalu dev server → http://localhost:5180
./run.sh seed               # buat/naikkan admin pertama dari ADMIN_EMAIL
./run.sh demo               # (opsional) 80 user demo + ±4.700 rekap
```

### Semua perintah `run.sh`

| Perintah | Fungsi |
|---|---|
| `./run.sh` | Mode development (port 5180) |
| `./run.sh prod` | Build lalu jalankan versi produksi |
| `./run.sh seed` | Buat/naikkan admin dari `ADMIN_EMAIL` |
| `./run.sh demo` | Isi ulang data demo (mengganti semua user `@demo.local`) |
| `./run.sh clean` | Hapus data demo |
| `./run.sh purge [--dry-run] [--days=90]` | Bersihkan permanen rekap yang dihapus admin lebih dari N hari |
| `./run.sh backup` | Backup database + screenshot ke `./backups` (simpan 7 hari) |
| `./run.sh restore <db.dump> [uploads.tar.gz]` | Pulihkan dari backup (menimpa data saat ini) |

Setiap perintah otomatis: memasang dependency bila perlu, mengecek koneksi database, dan menjalankan migrasi.

---

## Akun contoh untuk login

Aplikasi tidak memakai password. Di mode dev, halaman `/login` punya form **Login dev**: ketik email lalu **Masuk**.

| Email | Role / status | Yang bisa dicoba |
|---|---|---|
| `harlicuan@gmail.com` | **Admin** (dari `ADMIN_EMAIL`) | Semua fitur admin. Juga bisa login lewat Google. |
| `user@demo.local` | User · disetujui | Dashboard, tambah/edit rekap, riwayat, 3 akun aktif (X, Instagram, Threads) |
| `pending@demo.local` | User · menunggu | Halaman "Menunggu persetujuan" — setujui dari akun admin |
| `ditolak@demo.local` | User · ditolak | Halaman ditolak + alasan, tombol daftar ulang |
| `suspend@demo.local` | User · ditangguhkan | Halaman akun ditangguhkan + alasan |
| email baru, mis. `coba@test.com` | User baru | Alur pendaftaran dari awal |

Catatan:
- Akun `@demo.local` dibuat oleh `./run.sh demo`; menjalankan ulang **mengganti seluruh data demo**.
- Admin hasil seed belum punya e-wallet & akun sosmed, sehingga di dashboard user muncul peringatan "belum bisa membuat rekap".
- Form Login dev **tidak ada** di build produksi.

---

## Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create OAuth client ID** → *Web application*
2. **Authorized redirect URIs**:
   - `http://localhost:5180/auth/google/callback` (development)
   - `https://domain-anda/auth/google/callback` (produksi)
3. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env`
4. Selama *OAuth consent screen* berstatus **Testing**, hanya email yang didaftarkan sebagai *Test users* yang bisa login.
   Untuk produksi ubah ke **In production** (scope yang dipakai hanya email & profil).

User yang dibuat admin (menu *Tambah user*) cukup login Google dengan email yang sama — akun otomatis terhubung.

---

## Deploy produksi

### Update cepat: `./deploy.sh`

Setelah perubahan di-commit, satu perintah ini push ke GitHub lalu memperbarui server:

```bash
./deploy.sh --dry-run   # lihat commit yang akan dikirim & langkah yang dibutuhkan
./deploy.sh             # deploy
```

Urutannya: cek working tree bersih & branch `main` → push → (backup DB bila ada migrasi) → `git pull` →
`npm ci` bila dependency berubah → migrasi bila `drizzle/` berubah → build → `pm2 restart` → health check.
Bila health check gagal, server otomatis dikembalikan ke commit sebelumnya.

Konfigurasi di `.deploy.env` (tidak ikut git): `DEPLOY_HOST`, `DEPLOY_DIR`, `DEPLOY_PM2`, `DEPLOY_URL`,
dan opsional `DEPLOY_SSHPASS` (bila belum memakai SSH key).


### 1. Environment (`.env`)

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL |
| `ORIGIN` | URL publik, mis. `https://rekap.domain.com` (wajib, untuk OAuth & proteksi CSRF) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Kredensial OAuth |
| `ADMIN_EMAIL` | Email admin pertama (`./run.sh seed`) |
| `UPLOAD_DIR` | Folder screenshot (default `./uploads`) |
| `BODY_SIZE_LIMIT` | Batas ukuran upload, default `12M` |
| `PORT` | Port server Node (default 3000; `./run.sh prod` memakai 5180) |

### 2. Build & jalankan

```bash
npm ci
npm run db:migrate
npm run build
node --env-file=.env build          # atau ./run.sh prod
```

Jalankan sebagai service agar otomatis hidup kembali, contoh **systemd** (`/etc/systemd/system/retwepo.service`):

```ini
[Unit]
Description=Retwepo
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/retwepo
ExecStart=/usr/bin/node --env-file=.env build
Environment=PORT=3000
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

### 3. HTTPS lewat reverse proxy (contoh Nginx)

```nginx
server {
    server_name rekap.domain.com;
    client_max_body_size 12m;            # sesuaikan dengan BODY_SIZE_LIMIT
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Pasang sertifikat dengan `certbot --nginx`. Bila memakai proxy, set juga `ADDRESS_HEADER=X-Forwarded-For`
dan `XFF_DEPTH=1` agar pembatas login per IP membaca alamat asli pengunjung.

### 4. Backup terjadwal

```bash
crontab -e
# setiap hari jam 02.00
0 2 * * * cd /srv/retwepo && ./run.sh backup >> backups/backup.log 2>&1
```

Salin folder `backups/` secara berkala ke tempat lain (disk/server berbeda atau cloud storage).
Backup sudah diuji bisa dipulihkan dengan `./run.sh restore`.

---

## Catatan teknis

- **Screenshot** dikompres ke WebP (lebar maks. 1600 px; near-lossless untuk tampilan aplikasi, lossy untuk foto),
  disimpan di `UPLOAD_DIR/YYYY/MM/`, dan hanya bisa diakses pemiliknya atau admin.
- **Rekap terhapus** tetap disimpan dan tidak dihitung di statistik/export (view database `active_recaps`).
  Bila tabel `recaps` mendapat kolom baru, buat ulang view tersebut (lihat `drizzle/0004_active_recaps_view.sql`).
- **Pembersihan otomatis** berjalan di proses server: 1 menit setelah server menyala, lalu tiap 24 jam.
  Batas hari diatur di `DELETED_RETENTION_DAYS` (`src/lib/constants.js`).
- **Pembatasan aksi** (rate limit) disimpan di memori proses: tambah rekap 60/10 menit & 500/hari, edit rekap 30/10 menit,
  tambah akun 10/jam, login 20/10 menit per IP. Bila nanti memakai lebih dari satu instance server, pindahkan ke Redis/database.
- **Error tak terduga** tampil dengan kode referensi; kode yang sama tercatat di log server (`[error KODE] …`).
- Zona waktu tampilan & statistik: **WIB (Asia/Jakarta)**.

### Cek nama pemilik e-wallet (opsional)

Belum ada API resmi gratis dari DANA/OVO/GoPay/ShopeePay/LinkAja, jadi pengecekan memakai endpoint pihak ketiga
yang bisa diganti kapan saja lewat `.env`:

| Variabel | Keterangan |
|---|---|
| `EWALLET_CHECK_URL` | mis. `https://api.contoh.com/cek?ewallet={provider}&nomor={number}` — placeholder `{provider}` (dana, ovo, …), `{number}` (08…), `{number62}` (628…) |
| `EWALLET_CHECK_TOKEN` | opsional, dikirim sebagai `Authorization: Bearer …` |
| `EWALLET_CHECK_NAME_PATH` | opsional, lokasi nama di JSON (mis. `data.account_name`); bila kosong dicari otomatis |

- Dicek otomatis saat user mendaftar, mengganti e-wallet, atau saat admin membuka detail user yang belum dicek; admin bisa *Cek ulang*.
- **Aplikasi tetap berjalan bila mesin cek mati / belum diatur:** batas waktu 8 detik, setelah 3 kegagalan beruntun
  pengecekan dijeda 10 menit, hasil lama tidak ditimpa, dan admin melihat label *"cocokkan manual saat transfer"*.
- Nomor e-wallet dikirim ke pihak ketiga tersebut — pakai hanya penyedia yang dipercaya.

### Struktur singkat

```
src/
  routes/app/        halaman user        routes/admin/     halaman admin
  routes/auth/       login Google & dev  routes/uploads/   akses screenshot
  lib/server/        query, aksi, auth, export, rate limit, pembersihan
  lib/components/    komponen UI (Shell, modal, tabel, kartu, grafik)
drizzle/             migrasi database
scripts/             seed, data demo, purge, backup, restore
```

### Troubleshooting

| Gejala | Solusi |
|---|---|
| `sorry, too many clients already` | Restart server dev (`Ctrl+C` lalu `./run.sh`). Sudah dicegah di kode; bisa muncul dari server lama sebelum perbaikan. |
| Port 5180 dipakai | `./run.sh` otomatis menghentikan proses lama di port tersebut. |
| `redirect_uri_mismatch` saat login Google | Pastikan redirect URI di Google Console sama persis dan tanpa `/` di akhir. |
| Halaman error 500 | Cari kode referensi yang tampil di log server untuk melihat detail error. |

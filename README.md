# Retwepo — Rekap Postingan & Reply Sosmed

SvelteKit 3 · PostgreSQL (Drizzle) · Google OAuth (Arctic) · Tailwind 4 · ECharts · Sharp

## Menjalankan
Cara cepat:
```bash
cp .env.example .env        # isi DATABASE_URL, GOOGLE_CLIENT_ID/SECRET
./run.sh                    # install, cek DB, migrasi, lalu dev server → http://localhost:5180
./run.sh seed               # admin pertama dari ADMIN_EMAIL
./run.sh demo               # (opsional) 80 user demo + rekap
./run.sh clean              # hapus data demo
./run.sh prod               # build & jalankan versi produksi
```

Atau manual:
```bash
npm install
npm run db:migrate          # buat tabel
npm run db:seed             # admin pertama dari ADMIN_EMAIL
npm run db:seed-demo        # (opsional) 80 user demo + rekap
npm run dev                 # http://localhost:5180
```

## Akun contoh untuk login
Aplikasi tidak memakai password. Di mode dev (`./run.sh`), halaman `/login` punya form **Login dev**:
cukup ketik email di bawah lalu klik **Masuk**.

| Email | Role / status | Yang bisa dicoba |
|---|---|---|
| `harlicuan@gmail.com` | **Admin** (dari `ADMIN_EMAIL`) | Statistik, verifikasi user & akun, galeri rekap, export CSV. Juga bisa login lewat Google. |
| `user@demo.local` | User · disetujui | Dashboard, tambah rekap, riwayat (infinite scroll), 3 akun aktif (X, Instagram, Threads) |
| `pending@demo.local` | User · menunggu persetujuan | Halaman "Menunggu persetujuan admin" — setujui dari akun admin |
| `ditolak@demo.local` | User · ditolak | Halaman ditolak + alasan, tombol daftar ulang |
| `suspend@demo.local` | User · ditangguhkan | Halaman akun ditangguhkan + alasan |
| email baru apa saja, mis. `coba@test.com` | User baru | Alur pendaftaran dari awal (form nickname, e-wallet, akun sosmed) |

Catatan:
- Akun `@demo.local` dibuat oleh `./run.sh demo`. Menjalankan ulang akan **mengganti seluruh data demo** (76 user acak lainnya juga dibuat ulang).
- Admin hasil seed belum punya e-wallet & akun sosmed, jadi di Dashboard user akan muncul peringatan
  "belum bisa membuat rekap" sampai profil dan akun sosmednya dilengkapi.
- Form Login dev otomatis **tidak ada** di build produksi; di sana login hanya lewat Google.

## Google OAuth
Google Cloud Console → Credentials → OAuth client ID (Web application)
- Authorized redirect URI: `http://localhost:5180/auth/google/callback` (+ URL produksi)
- Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env`

Selama mode dev, halaman login juga punya form **login dev** (email saja) — otomatis nonaktif di build produksi.

## Produksi
```bash
npm run build
ORIGIN=https://domain-anda node --env-file=.env build
```
Screenshot disimpan di `UPLOAD_DIR` (default `./uploads`) — sertakan folder ini dalam backup.

## Alur
1. Login Google → isi form daftar (nickname, e-wallet, akun sosmed) → status *pending*
2. Admin menyetujui user (akun sosmed yang diajukan ikut disetujui)
3. Akun sosmed unik global: `(platform, username)` tidak bisa dipakai user lain kecuali statusnya *rejected*
4. Akun yang ditambahkan belakangan perlu disetujui admin lagi
5. Rekap hanya bisa dibuat bila profil lengkap (nickname + e-wallet) **dan** minimal satu akun sosmed sudah diverifikasi
6. Rekap: pilih akun, tipe post/reply, URL dan/atau screenshot (minimal salah satu); screenshot dikompres otomatis ke WebP

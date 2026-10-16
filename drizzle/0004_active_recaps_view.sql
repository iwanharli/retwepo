-- Rekap yang tidak dihapus admin. Dipakai semua query statistik & daftar.
-- Catatan: view "SELECT *" membekukan daftar kolom; buat ulang view ini bila kolom recaps bertambah.
CREATE OR REPLACE VIEW "active_recaps" AS SELECT * FROM "recaps" WHERE "deleted_at" IS NULL;

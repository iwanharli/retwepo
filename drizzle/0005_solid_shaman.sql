ALTER TABLE "recaps" ADD COLUMN "url_key" text;--> statement-breakpoint
CREATE INDEX "recaps_url_key_idx" ON "recaps" USING btree ("url_key");--> statement-breakpoint
-- view active_recaps membekukan daftar kolom: buat ulang agar url_key ikut
DROP VIEW IF EXISTS "active_recaps";--> statement-breakpoint
CREATE VIEW "active_recaps" AS SELECT * FROM "recaps" WHERE "deleted_at" IS NULL;

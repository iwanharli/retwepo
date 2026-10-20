CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(60) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- kampanye awal; semua rekap lama masuk ke EconomicFrontline
INSERT INTO "campaigns" ("name", "sort_order") VALUES ('EconomicFrontline', 1), ('Rosatom', 2);--> statement-breakpoint
ALTER TABLE "recaps" ADD COLUMN "campaign_id" integer;--> statement-breakpoint
UPDATE "recaps" SET "campaign_id" = (SELECT "id" FROM "campaigns" WHERE "name" = 'EconomicFrontline');--> statement-breakpoint
ALTER TABLE "recaps" ALTER COLUMN "campaign_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recaps" ADD CONSTRAINT "recaps_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recaps_campaign_idx" ON "recaps" USING btree ("campaign_id","posted_at");--> statement-breakpoint
-- view active_recaps membekukan daftar kolom: buat ulang agar campaign_id ikut
DROP VIEW IF EXISTS "active_recaps";--> statement-breakpoint
CREATE VIEW "active_recaps" AS SELECT * FROM "recaps" WHERE "deleted_at" IS NULL;

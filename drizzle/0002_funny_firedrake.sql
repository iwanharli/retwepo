CREATE TABLE "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"action" varchar(40) NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" integer,
	"target_label" text,
	"note" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recap_edits" (
	"id" serial PRIMARY KEY NOT NULL,
	"recap_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"reason" text NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_edits" ADD CONSTRAINT "recap_edits_recap_id_recaps_id_fk" FOREIGN KEY ("recap_id") REFERENCES "public"."recaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_edits" ADD CONSTRAINT "recap_edits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_logs_created_idx" ON "admin_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_logs_target_idx" ON "admin_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "recap_edits_recap_idx" ON "recap_edits" USING btree ("recap_id","created_at");
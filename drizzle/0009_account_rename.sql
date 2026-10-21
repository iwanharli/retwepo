ALTER TABLE "social_accounts" ADD COLUMN "pending_username" varchar(100);--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "rename_note" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "rename_requested_at" timestamp with time zone;
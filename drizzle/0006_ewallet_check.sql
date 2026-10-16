ALTER TABLE "users" ADD COLUMN "ewallet_holder" varchar(120);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ewallet_check_status" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ewallet_check_key" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ewallet_checked_at" timestamp with time zone;
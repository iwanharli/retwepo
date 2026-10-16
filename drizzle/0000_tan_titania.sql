CREATE TYPE "public"."account_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('twitter', 'instagram', 'threads', 'youtube', 'facebook');--> statement-breakpoint
CREATE TYPE "public"."recap_type" AS ENUM('post', 'reply');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('incomplete', 'pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "recaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"social_account_id" integer NOT NULL,
	"type" "recap_type" NOT NULL,
	"url" text,
	"target_url" text,
	"screenshot_path" text,
	"note" text,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recaps_evidence_chk" CHECK ("recaps"."url" IS NOT NULL OR "recaps"."screenshot_path" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" "platform" NOT NULL,
	"username" varchar(100) NOT NULL,
	"status" "account_status" DEFAULT 'pending' NOT NULL,
	"status_note" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"google_id" varchar(64),
	"google_name" varchar(255),
	"avatar_url" text,
	"nickname" varchar(50),
	"ewallet_provider" varchar(30),
	"ewallet_number" varchar(30),
	"role" "role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'incomplete' NOT NULL,
	"status_note" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"registered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "recaps" ADD CONSTRAINT "recaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recaps" ADD CONSTRAINT "recaps_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recaps_posted_idx" ON "recaps" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "recaps_user_posted_idx" ON "recaps" USING btree ("user_id","posted_at");--> statement-breakpoint
CREATE INDEX "recaps_account_idx" ON "recaps" USING btree ("social_account_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "social_accounts_platform_username_uq" ON "social_accounts" USING btree ("platform","username") WHERE "social_accounts"."status" <> 'rejected';--> statement-breakpoint
CREATE INDEX "social_accounts_user_idx" ON "social_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_accounts_status_idx" ON "social_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_registered_idx" ON "users" USING btree ("registered_at");
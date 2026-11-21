ALTER TABLE "factfit"."applications" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "factfit"."applications" ADD COLUMN "deadline" date;--> statement-breakpoint
ALTER TABLE "factfit"."applications" ADD COLUMN "status_note" text DEFAULT '' NOT NULL;
CREATE SCHEMA IF NOT EXISTS "factfit";
--> statement-breakpoint
CREATE TABLE "factfit"."applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"jd_text" text NOT NULL,
	"analysis" jsonb NOT NULL,
	"analyzed_by" text NOT NULL,
	"bullets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "factfit"."applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "factfit"."experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"org" text DEFAULT '' NOT NULL,
	"location" text,
	"start_date" text,
	"end_date" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "factfit"."experiences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "factfit"."facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"experience_id" uuid NOT NULL,
	"did" text NOT NULL,
	"result" text,
	"tech" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "factfit"."facts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "factfit"."profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"links" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "factfit"."profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "factfit"."rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
ALTER TABLE "factfit"."rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "factfit"."applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factfit"."experiences" ADD CONSTRAINT "experiences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factfit"."facts" ADD CONSTRAINT "facts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factfit"."facts" ADD CONSTRAINT "facts_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "factfit"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factfit"."profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_user_idx" ON "factfit"."applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "experiences_user_idx" ON "factfit"."experiences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "facts_user_idx" ON "factfit"."facts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "facts_experience_idx" ON "factfit"."facts" USING btree ("experience_id");
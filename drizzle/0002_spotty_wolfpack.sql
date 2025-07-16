ALTER TABLE "ai-app-template_message" ADD COLUMN "role" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "ai-app-template_message" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ai-app-template_message" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai-app-template_message" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
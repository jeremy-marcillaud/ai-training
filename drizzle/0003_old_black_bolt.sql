ALTER TABLE "ai-app-template_message" ADD COLUMN "parts" json NOT NULL;--> statement-breakpoint
ALTER TABLE "ai-app-template_message" ADD COLUMN "order" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "ai-app-template_message" DROP COLUMN IF EXISTS "content";
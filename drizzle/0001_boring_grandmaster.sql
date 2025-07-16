DROP INDEX IF EXISTS "chat_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "message_chat_id_idx";--> statement-breakpoint
ALTER TABLE "ai-app-template_chat" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai-app-template_request" ADD COLUMN "count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai-app-template_chat" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "ai-app-template_message" DROP COLUMN IF EXISTS "order";--> statement-breakpoint
ALTER TABLE "ai-app-template_message" DROP COLUMN IF EXISTS "content";--> statement-breakpoint
ALTER TABLE "ai-app-template_message" DROP COLUMN IF EXISTS "parts";--> statement-breakpoint
ALTER TABLE "ai-app-template_message" DROP COLUMN IF EXISTS "role";--> statement-breakpoint
ALTER TABLE "ai-app-template_message" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "ai-app-template_request" DROP COLUMN IF EXISTS "prompt_tokens";--> statement-breakpoint
ALTER TABLE "ai-app-template_request" DROP COLUMN IF EXISTS "completion_tokens";
ALTER TABLE "guilds" ADD COLUMN "minExp" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "guilds" ADD COLUMN "maxExp" integer DEFAULT 35 NOT NULL;--> statement-breakpoint
ALTER TABLE "guilds" ADD COLUMN "minCoins" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "guilds" ADD COLUMN "maxCoins" integer DEFAULT 85 NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "level" integer DEFAULT 0 NOT NULL;
CREATE TABLE "guilds" (
	"id" bigint PRIMARY KEY NOT NULL,
	"locale" char(2) DEFAULT 'en',
	"announceJoins" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" bigint PRIMARY KEY NOT NULL,
	"guildId" bigint
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_guildId_guilds_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;
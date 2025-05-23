CREATE TABLE "guilds" (
	"id" bigint PRIMARY KEY NOT NULL,
	"locale" char(2) DEFAULT 'en' NOT NULL,
	"announceJoins" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" bigint NOT NULL,
	"guildId" bigint NOT NULL,
	"exp" integer DEFAULT 0 NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "members_id_guildId_pk" PRIMARY KEY("id","guildId")
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_guildId_guilds_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;
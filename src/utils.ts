import { eq } from "drizzle-orm";
import { bot } from ".";
import { guilds } from "./schema";

export async function getGuildLocale(guildId: string) {
  const config = await bot.drizzle
    .select({ locale: guilds.locale })
    .from(guilds)
    .where(eq(guilds.id, Number(guildId)));

  return config[0].locale;
}

import { eq } from "drizzle-orm";
import { bot } from ".";
import { guilds } from "./schema";

export async function getGuildLocale(guildId: string) {
  const config = await bot.drizzle
    .select({ locale: guilds.locale })
    .from(guilds)
    .where(eq(guilds.id, Number(guildId)));
  if (!config[0].locale) config[0].locale = "en";

  return config[0].locale;
}

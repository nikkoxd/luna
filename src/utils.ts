import { eq } from "drizzle-orm";
import { bot } from ".";
import { guilds } from "./schema";

export async function getGuildLocale(guildId: string): Promise<string> {
  const [config] = await bot.drizzle
    .select({ locale: guilds.locale })
    .from(guilds)
    .where(eq(guilds.id, BigInt(guildId)));

  if (!config.locale) return "en";
  return config.locale;
}

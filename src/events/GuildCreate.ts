import { eq } from "drizzle-orm";
import { bot } from "..";
import { guilds } from "../schema";
import { Event } from "../base/Event";
import { Events, Guild } from "discord.js";

export default class GuildCreateEvent extends Event<Events.GuildCreate> {
    constructor() {
        super(Events.GuildCreate, false);
    };

    async execute(guild: Guild) {
        bot.logger.info(`Joined guild ${guild.id}.`)

        const guildConfig = await bot.drizzle.select().from(guilds).where(eq(guilds.id, BigInt(guild.id)));
        if (guildConfig.length > 0) {
            bot.logger.info("Guild entry found in database. Skipping configuration.")
            return;
        }

        bot.drizzle.insert(guilds).values({ id: BigInt(guild.id) }).then(() => {
            bot.logger.info("Guild configured.")
        }).catch((error: Error) => {
            bot.logger.error(`Error while configuring guild: ${error}`);
        });
    }
};

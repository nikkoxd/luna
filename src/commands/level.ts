import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../base/Command";
import { bot } from "..";
import { members } from "../schema";
import { eq } from "drizzle-orm";
import i18next from "i18next";

export default class LevelCommand extends Command {
    constructor() {
        super(new SlashCommandBuilder()
            .setName("level")
            .setDescription("Check your level")
            .setDescriptionLocalization("ru", "Проверить уровень")
        )
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const [user] = await bot.drizzle
                .select({ level: members.level })
                .from(members)
                .where(eq(members.id, BigInt(interaction.user.id)));

            interaction.reply({
                content: i18next.t(
                    "command.level.reply.level",
                    { level: user.level, lng: interaction.locale }
                )
            })
        } catch (error) {
            interaction.reply({
                content: i18next.t(
                    "command.level.reply.level",
                    { level: 0, lng: interaction.locale }
                )
            })
        }
    }
}

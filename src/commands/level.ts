import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { and, eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";
import { members } from "../schema";
import { levelToExp } from "../shared/conversions";

export default class LevelCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("level")
				.setDescription("Check your level")
				.setDescriptionLocalization("ru", "Проверить уровень")
		);
	}

	public async execute(
		interaction: ChatInputCommandInteraction
	): Promise<void> {
		try {
            if (!interaction.inGuild()) throw new Error("Not in guild");

			const [user] = await bot.db
				.select({ level: members.level, exp: members.exp })
				.from(members)
				.where(and(eq(members.id, BigInt(interaction.user.id)), eq(members.guildId, BigInt(interaction.guildId))));

			await interaction.reply({
				content: i18next.t("command.level.reply.level", {
					level: user.level,
                    currentExp: user.exp,
                    requiredExp: levelToExp(user.level + 1),
					lng: interaction.locale,
				}),
			});
		} catch {
			interaction.reply({
				content: i18next.t("command.level.reply.level", {
					level: 0,
                    currentExp: 0,
                    requiredExp: levelToExp(1),
					lng: interaction.locale,
				}),
			});
		}
	}
}

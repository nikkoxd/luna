import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";
import { members } from "../schema";
import { levelToExp } from "../utils";

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
			const [user] = await bot.db
				.select({ level: members.level, exp: members.exp })
				.from(members)
				.where(eq(members.id, BigInt(interaction.user.id)));

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

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";
import { members } from "../schema";

export default class BalanceCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("balance")
				.setDescription("Check your balance")
				.setDescriptionLocalization("ru", "Проверить баланс")
		);
	}

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		try {
			const [user] = await bot.db
				.select({ balance: members.balance })
				.from(members)
				.where(eq(members.id, BigInt(interaction.user.id)));

			await interaction.reply({
				content: i18next.t("command.balance.reply.balance", {
					balance: user.balance,
					lng: interaction.locale,
				}),
			});
		} catch {
			await interaction.reply({
				content: i18next.t("command.balance.reply.balance", {
					balance: 0,
					lng: interaction.locale,
				}),
			});
		}
	}
}

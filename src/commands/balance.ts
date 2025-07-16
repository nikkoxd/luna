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
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("The user to check balance")
						.setDescriptionLocalization(
							"ru",
							"Пользователь, которому нужно проверить баланс"
						)
						.setRequired(false)
				)
		);
	}

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const user = interaction.options.getUser("user");

		try {
			if (user) {
				const [userEntry] = await bot.db
					.select({ balance: members.balance })
					.from(members)
					.where(eq(members.id, BigInt(user.id)));

				await interaction.reply({
					content: i18next.t("command.balance.reply.balance_2", {
						tag: user.tag,
						balance: userEntry.balance,
						lng: interaction.locale,
					}),
				});
			} else {
				const [userEntry] = await bot.db
					.select({ balance: members.balance })
					.from(members)
					.where(eq(members.id, BigInt(interaction.user.id)));

				await interaction.reply({
					content: i18next.t("command.balance.reply.balance", {
						balance: userEntry.balance,
						lng: interaction.locale,
					}),
				});
			}
		} catch {
			if (user) {
				await interaction.reply({
					content: i18next.t("command.balance.reply.balance_2", {
						tag: user.tag,
						balance: 0,
						lng: interaction.locale,
					}),
				});
			} else {
				await interaction.reply({
					content: i18next.t("command.balance.reply.balance", {
						balance: 0,
						lng: interaction.locale,
					}),
				});
			}
		}
	}
}

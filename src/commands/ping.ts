import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";

export default class PingCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("ping")
				.setDescription("Pong!")
				.setDescriptionLocalization("ru", "Понг!")
		);
	}

	async execute(interaction: ChatInputCommandInteraction) {
		const ping = bot.client.ws.ping;
		interaction.reply(
			i18next.t("command.ping.reply", {
				ping: ping,
				lng: interaction.locale,
			})
		);
	}
}

import {
	ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";

export default class UnblockCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("unblock")
				.setDescription("Unblock user's access to sth")
				.setDescriptionLocalization(
					"ru",
					"Разблокировка доступа к чему-то"
				)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("gifs")
						.setDescription("Unblock gifs")
						.setDescriptionLocalization("ru", "Разблокировка гифок")
						.addUserOption((option) =>
							option
								.setName("user")
								.setDescription("The user to unblock")
								.setDescriptionLocalization(
									"ru",
									"Пользователь, которому нужно разблокировать гифки"
								)
								.setRequired(true)
						)
				)
		);
	}

	public async gifs(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			throw new Error("Not in guild");
		}

		const user = interaction.options.getUser("user", true);
		const channel = interaction.channel;

		if (!channel || channel.isThread()) {
			throw new Error("Can't edit channel permissions");
		}

		try {
			await channel.permissionOverwrites.edit(user, {
				EmbedLinks: null,
				AttachFiles: null,
			});

			// if no permissions are set, delete the overwrite
			const overwrite = channel.permissionOverwrites.cache.get(user.id);
			if (overwrite?.deny.toArray().length === 0) {
				await channel.permissionOverwrites.delete(user);
			}
		} catch (error) {
			bot.logger.error(
				`Error while editing channel permissions: ${error}`
			);

			await interaction.reply({
				content: i18next.t("command.unblock.reply.error"),
				flags: [MessageFlags.Ephemeral],
			});
		} finally {
			await interaction.reply({
				content: i18next.t("command.unblock.gifs.reply.success", {
					userId: user.id,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		}
	}

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "gifs": {
				await this.gifs(interaction);
				break;
			}
		}
	}
}

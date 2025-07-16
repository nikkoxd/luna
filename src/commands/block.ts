import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { bot } from "..";
import { Command } from "../base/Command";
import i18next from "i18next";

export default class BlockCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("block")
				.setDescription("Block user's access to sth")
				.setDescriptionLocalization(
					"ru",
					"Блокировка доступа к чему-то"
				)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("gifs")
						.setDescription("Block gifs")
						.setDescriptionLocalization("ru", "Блокировка гифок")
						.addUserOption((option) =>
							option
								.setName("user")
								.setDescription("The user to block")
								.setDescriptionLocalization(
									"ru",
									"Пользователь, которому нужно заблокировать гифки"
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
				EmbedLinks: false,
				AttachFiles: false,
			});
		} catch (error) {
			bot.logger.error(
				`Error while editing channel permissions: ${error}`
			);

			await interaction.reply({
				content: i18next.t("command.block.reply.error"),
				flags: [MessageFlags.Ephemeral],
			});
		} finally {
            await interaction.reply({
                content: i18next.t("command.block.gifs.reply.success", {
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

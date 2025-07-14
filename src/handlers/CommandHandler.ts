import {
	ApplicationCommandDataResolvable,
	Client,
	Events,
	Interaction,
	MessageFlags,
	REST,
	Routes,
} from "discord.js";

import { readdirSync } from "fs";
import path from "path";
import { Logger } from "winston";

import { Command } from "../base/Command";
import i18next from "i18next";

export class CommandHandler {
	public static commands = new Array<ApplicationCommandDataResolvable>();
	public static commandsCollection = new Map<string, Command>();

	public static async register(
		commandsPath: string,
		client: Client,
		logger: Logger
	) {
		logger.info(`Registering commands from path: ${commandsPath}`);

		if (!process.env.TOKEN) {
			throw new Error("TOKEN is not set");
		}

		const rest = new REST().setToken(process.env.TOKEN);
		const files = readdirSync(commandsPath).filter(
			(file) => !file.endsWith(".map")
		);

		for (const file of files) {
			const filePath = path.join(commandsPath, file);
            logger.info(`Registering command: ${filePath}`);

			const command = await import(filePath);

			const commandClass = command.default;
			if (!commandClass || !(commandClass.prototype instanceof Command)) {
				logger.warn(`Skipping invalid command file: ${file}`);
				continue;
			}

			const commandInstance: Command = new commandClass();
			this.commands.push(commandInstance.data);
			this.commandsCollection.set(
				commandInstance.data.name,
				commandInstance
			);
		}

		try {
			await rest.put(Routes.applicationCommands(client.user!.id), {
				body: this.commands,
			});
		} catch (error) {
			logger.error(error);
		} finally {
			logger.info("Registered commands");
		}
	}

	public static async onInteractionCreate(client: Client, logger: Logger) {
		client.on(
			Events.InteractionCreate,
			async (interaction: Interaction): Promise<unknown> => {
				if (!interaction.isChatInputCommand()) return;

				const command = this.commandsCollection.get(
					interaction.commandName
				);
				if (!command) return;

				try {
					await command.execute(interaction);
				} catch (error) {
					logger.error(error);

                    await interaction.reply({
                        content: i18next.t("internal_error"),
                        flags: [MessageFlags.Ephemeral]
                    })
				} finally {
					logger.info(
						`Command /${command.data.name} was executed by ${interaction.user.tag} (${interaction.user.id})`
					);
				}
			}
		);
	}
}

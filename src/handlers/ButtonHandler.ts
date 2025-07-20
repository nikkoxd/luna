import { Client, Events, Interaction, MessageFlags } from "discord.js";

import { readdirSync } from "fs";
import i18next from "i18next";
import path from "path";
import { Logger } from "winston";

import { Button } from "../base/Button";

export class ButtonHandler {
	public static buttons = new Map<string, Button>();

	public static async register(
		buttonsPath: string,
		logger: Logger
	) {
		logger.info(
			`Registering button interactions from path: ${buttonsPath}`
		);

		const files = readdirSync(buttonsPath).filter(
			(file) => !file.endsWith(".map")
		);

		for (const file of files) {
			const filePath = path.join(buttonsPath, file);
			logger.info(`Registering button interaction: ${filePath}`);

			const button = await import(filePath);

			const buttonClass = button.default;
			if (!buttonClass || !(buttonClass.prototype instanceof Button)) {
				logger.warn(
					`Skipping invalid button interaction file: ${file}`
				);
				continue;
			}

			const buttonInstance: Button = new buttonClass();
            this.buttons.set(
                buttonInstance.name,
                buttonInstance
            )
		}

		logger.info("Buttons registered.");
	}

	public static async onInteractionCreate(client: Client, logger: Logger) {
		client.on(
			Events.InteractionCreate,
			async (interaction: Interaction): Promise<unknown> => {
				if (!interaction.isButton()) return;

				const button = this.buttons.get(interaction.customId);
				if (!button) return;

				try {
					await button.execute(interaction);
				} catch (error) {
					logger.error(error);

					await interaction.reply({
						content: i18next.t("internal_error"),
						flags: [MessageFlags.Ephemeral],
					});
				} finally {
					logger.info(
						`Button interaction /${button.name} was executed by ${interaction.user.tag} (${interaction.user.id})`
					);
				}
			}
		);
	}
}

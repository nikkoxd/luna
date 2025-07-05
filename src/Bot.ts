import { ActivityType, Client, Events } from "discord.js";

import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import i18next, { InitOptions } from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";
import { Logger } from "winston";

import { CommandHandler } from "./handlers/CommandHandler";
import { EventHandler } from "./handlers/EventHandler";

export class Bot {
	private async runMigrations() {
        this.logger.info("Running migrations...");
		await migrate(this.drizzle, {
			migrationsFolder: path.join(__dirname, "..", "drizzle"),
		});
		this.logger.info("Migrations finished.");
	}

	private async initializei18next() {
        this.logger.info("Initializing i18next...");
		await i18next.use(Backend).init(this.i18nextOptions);
		this.logger.info("i18next initialized.");
	}

	public constructor(
		public client: Client,
		public drizzle: NodePgDatabase,
		public logger: Logger,
		private i18nextOptions: InitOptions
	) {
		client.login(process.env.TOKEN);

		this.client.on(Events.ClientReady, async (readyClient) => {
			readyClient.user?.setActivity("dsc.gg/starrysky", {
				type: ActivityType.Watching,
				url: "https://dsc.gg/starrysky",
			});

			await this.runMigrations();
			await this.initializei18next();
			await EventHandler.register(
				path.join(__dirname, "events"),
				this.client,
				this.logger
			);
			await CommandHandler.register(
				path.join(__dirname, "commands"),
				this.client,
				this.logger
			);
			await CommandHandler.onInteractionCreate(this.client, this.logger);

			this.logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
		});
	}
}

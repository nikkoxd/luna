import { ActivityType, Client, ClientOptions, Events } from "discord.js";

import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import i18next, { InitOptions } from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";
import { PoolConfig } from "pg";
import { Logger, LoggerOptions, createLogger } from "winston";

import { CommandHandler } from "./handlers/CommandHandler";
import { EventHandler } from "./handlers/EventHandler";
import { BotConfig } from "./types";

export class Bot {
	public readonly client: Client;
	public readonly db: NodePgDatabase;
	public readonly logger: Logger;

	private async runMigrations() {
		this.logger.info("Running migrations...");
		await migrate(this.db, {
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
		public readonly config: BotConfig,
		private clientOptions: ClientOptions,
		private dbOptions: PoolConfig,
		private loggerOptions: LoggerOptions,
		private i18nextOptions: InitOptions
	) {
		this.client = new Client(this.clientOptions);
		this.db = drizzle({ connection: this.dbOptions });
		this.logger = createLogger(this.loggerOptions);

		this.client.login(process.env.TOKEN);

		this.client.on(Events.ClientReady, async (readyClient) => {
			readyClient.user?.setActivity("dsc.gg/starrysky", {
				type: ActivityType.Watching,
				url: "https://dsc.gg/starrysky",
			});

			await this.runMigrations();
			await this.initializei18next();
			await EventHandler.register(
                this.config.eventsPath,
				this.client,
				this.logger
			);
			await CommandHandler.register(
                this.config.commandsPath,
				this.client,
				this.logger
			);
			await CommandHandler.onInteractionCreate(this.client, this.logger);

			this.logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
		});
	}
}

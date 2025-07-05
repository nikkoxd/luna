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
	public client: Client;
	public db: NodePgDatabase;
	public logger: Logger;

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
		public config: BotConfig,
		clientOptions: ClientOptions,
		dbOptions: PoolConfig,
		loggerOptions: LoggerOptions,
		private i18nextOptions: InitOptions
	) {
		this.client = new Client(clientOptions);
		this.db = drizzle({ connection: dbOptions });
		this.logger = createLogger(loggerOptions);

		this.client.login(process.env.TOKEN);

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

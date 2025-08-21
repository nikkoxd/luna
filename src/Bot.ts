import {
	ActivityType,
	Client,
	ClientOptions,
	Events,
	HexColorString,
} from "discord.js";

import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import i18next, { InitOptions } from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";
import { PoolConfig } from "pg";
import { Logger, LoggerOptions, createLogger } from "winston";

import { ButtonHandler } from "./handlers/ButtonHandler";
import { CommandHandler } from "./handlers/CommandHandler";
import { EventHandler } from "./handlers/EventHandler";

export interface BotConfig {
	color: HexColorString;
	activity: {
		name: string;
		type?: ActivityType;
		url?: string;
	};
	path: {
		commands: string;
		events: string;
		buttons: string;
	};
}

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
			readyClient.user?.setActivity(config.activity.name, {
				type: config.activity.type,
				url: config.activity.url,
			});

			await this.runMigrations();
			await this.initializei18next();
			await EventHandler.register(
				this.config.path.events,
				this.client,
				this.logger
			);
			await ButtonHandler.register(this.config.path.buttons, this.logger);
			await ButtonHandler.onInteractionCreate(this.client, this.logger);
			await CommandHandler.register(
				this.config.path.commands,
				this.client,
				this.logger
			);
			await CommandHandler.onInteractionCreate(this.client, this.logger);

			this.logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
		});
	}
}

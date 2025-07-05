import { Client, ClientEvents } from "discord.js";

import { readdirSync } from "fs";
import path from "path";
import { Logger } from "winston";

import { Event } from "../base/Event";

export class EventHandler {
	public static async register(
		eventsPath: string,
		client: Client,
		logger: Logger
	) {
		logger.info(`Registering events from path: ${eventsPath}`);

		const eventFiles = readdirSync(eventsPath).filter(
			(file) => !file.endsWith(".map")
		);

		for (const file of eventFiles) {
			const filePath = path.join(eventsPath, file);
            logger.info(`Registering event: ${filePath}`);
			const event = await import(filePath);
			const eventClass = event.default;

			if (!eventClass || !(eventClass.prototype instanceof Event)) {
				logger.warn(`Skipping invalid event file: ${file}`);
				continue;
			}

			const eventInstance: Event<keyof ClientEvents> = new eventClass();
			if (eventInstance.once) {
				client.once(eventInstance.name, (...args) =>
					eventInstance.execute(...args)
				);
			} else {
				client.on(eventInstance.name, (...args) =>
					eventInstance.execute(...args)
				);
			}
		}

		logger.info("Events registered.");
	}
}

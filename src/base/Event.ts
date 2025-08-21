import { ClientEvents } from "discord.js";

export abstract class Event<K extends keyof ClientEvents> {
	abstract execute(...args: ClientEvents[K]): Promise<void>;

	protected constructor(public name: K, public once: boolean = false) {}
}

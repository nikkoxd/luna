import { ClientEvents } from "discord.js";

export abstract class Event<K extends keyof ClientEvents> {
	name: K;
	once: boolean;
	abstract execute(...args: ClientEvents[K]): Promise<void>;

	protected constructor(name: K, once: boolean = false) {
		this.name = name;
		this.once = once;
	}
}

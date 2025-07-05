import { HexColorString } from "discord.js";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			[key: string]: string | undefined;
			TOKEN: string;
			OWNER_ID: string | undefined;
			POSTGRES_HOST: string;
			POSTGRES_USER: string;
			POSTGRES_PASSWORD: string;
			POSTGRES_DB: string;
		}
	}
}

export interface BotConfig {
	color: HexColorString;
}

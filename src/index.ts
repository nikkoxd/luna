import { GatewayIntentBits } from "discord.js";

import dotenv from "dotenv";
import { format, transports } from "winston";

import { Bot } from "./Bot";

dotenv.config();

export const bot = new Bot(
	{
		color: "#ef75ff",
	},
	{
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
		],
	},
	{
		host: process.env.POSTGRES_HOST,
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DB,
	},
	{
		level: "info",
		format: format.printf(({ level, message }) => {
			return `[${level}] ${message}`;
		}),
		transports: [new transports.Console()],
	},
	{
		fallbackLng: "en",
		preload: ["en", "ru"],
		backend: {
			loadPath: "./locales/{{lng}}.json",
		},
	}
);

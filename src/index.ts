import { Client, GatewayIntentBits } from "discord.js";
import { Bot } from "./Bot";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { createLogger, format, transports } from "winston";

dotenv.config();

export const bot = new Bot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages
    ]
  }),
  drizzle({
    connection: {
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    }
  }),
  createLogger({
    level: "info",
    format: format.cli(),
    transports: [new transports.Console()]
  }),
  {
    fallbackLng: "en",
    preload: ["en", "ru"],
    backend: {
      loadPath: "./locales/{{lng}}.json",
    }
  },
)

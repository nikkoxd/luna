import { Client, GatewayIntentBits } from 'discord.js';
import { Bot } from './classes/Bot';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

export const bot = new Bot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers
    ]
  }),
  new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  })
)

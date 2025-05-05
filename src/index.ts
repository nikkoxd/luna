import { Client, GatewayIntentBits } from 'discord.js';
import { Bot } from './classes/Bot';
import dotenv from 'dotenv';

dotenv.config();

export const bot = new Bot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds
    ]
  })
)

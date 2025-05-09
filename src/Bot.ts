import { ApplicationCommandDataResolvable, Client, Collection, Events, Interaction, REST, Routes } from "discord.js";
import { Command } from "./types/Command";
import path from "path";
import { readdirSync } from "fs";
import { Event } from "./types/Event";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import i18next, { InitOptions } from "i18next";
import Backend from "i18next-fs-backend";

export class Bot {
  public commands = new Array<ApplicationCommandDataResolvable>();
  public commandsCollection = new Collection<string, Command>();

  public constructor(public client: Client, public drizzle: NodePgDatabase, private i18nextOptions: InitOptions) {
    client.login(process.env.TOKEN);

    this.client.on(Events.ClientReady, readyClient => {
      console.info(`Ready! Logged in as ${readyClient.user.tag}`)

      i18next
        .use(Backend)
        .init(this.i18nextOptions);

      migrate(this.drizzle, {
        migrationsFolder: path.join(__dirname, '..', 'drizzle'),
      });

      this.registerEvents();
      this.registerCommands();
      this.onInteractionCreate();
    });
  }

  private async registerEvents() {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => !file.endsWith('.map'));

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = await import(filePath);
      const eventClass: Event = event.default;

      if (eventClass.once) {
        this.client.once(eventClass.name, (...args) => eventClass.execute(...args));
      } else {
        this.client.on(eventClass.name, (...args) => eventClass.execute(...args));
      }
    }
  }

  private async registerCommands() {
    const rest = new REST().setToken(process.env.TOKEN!);

    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = readdirSync(commandsPath).filter(file => !file.endsWith(".map"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);
      const commandClass: Command = command.default;

      this.commands.push(commandClass.data);
      this.commandsCollection.set(commandClass.data.name, commandClass);
    }

    try {
      rest.put(Routes.applicationCommands(this.client.user!.id), { body: this.commands })
    } catch (error: any) {
      console.error(error);
    } finally {
      console.info("Registered commands");
    }
  }

  private async onInteractionCreate() {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<any> => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commandsCollection.get(interaction.commandName);
      if (!command) return;

      try {
        command.execute(interaction);
      } catch (error) {
        console.error(error);
      } finally {
        console.info(`Command /${command.data.name} executed by ${interaction.user.tag} (${interaction.user.id})`);
      }
    })
  }
}

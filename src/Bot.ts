import { ApplicationCommandDataResolvable, Client, Collection, Events, Interaction, REST, Routes } from "discord.js";
import path from "path";
import { readdirSync } from "fs";
import { Event } from "./base/Event";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import i18next, { InitOptions } from "i18next";
import Backend from "i18next-fs-backend";
import { Logger } from "winston";
import { Command } from "./base/Command";

export class Bot {
  public commands = new Array<ApplicationCommandDataResolvable>();
  public commandsCollection = new Collection<string, Command>();

  public constructor(public client: Client, public drizzle: NodePgDatabase, public logger: Logger, private i18nextOptions: InitOptions) {
    client.login(process.env.TOKEN);

    this.client.on(Events.ClientReady, readyClient => {
      this.logger.info(`Ready! Logged in as ${readyClient.user.tag}`)

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
      const eventClass = event.default;

      if (!eventClass || !(eventClass.prototype instanceof Event)) {
        this.logger.warn(`Skipping invalid event file: ${file}`)
        continue;
      }

      const eventInstance: Event<any> = new eventClass();
      if (eventInstance.once) {
        this.client.once(eventInstance.name, (...args) => eventInstance.execute(...args));
      } else {
        this.client.on(eventInstance.name, (...args) => eventInstance.execute(...args));
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
      const commandClass = command.default;

      if (!commandClass || !(commandClass.prototype instanceof Command)) {
        this.logger.warn(`Skipping invalid command file: ${file}`)
        continue;
      }

      const commandInstance: Command = new commandClass();
      this.commands.push(commandInstance.data);
      this.commandsCollection.set(commandInstance.data.name, commandInstance);
    }

    try {
      rest.put(Routes.applicationCommands(this.client.user!.id), { body: this.commands })
    } catch (error: any) {
      this.logger.error(error);
    } finally {
      this.logger.info("Registered commands");
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
        this.logger.error(error);
      } finally {
        this.logger.info(`Command /${command.data.name} executed by ${interaction.user.tag} (${interaction.user.id})`);
      }
    })
  }
}

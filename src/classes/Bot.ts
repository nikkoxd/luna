import { ApplicationCommandDataResolvable, Client, Collection, Events, Interaction, REST, Routes } from "discord.js";
import { Command } from "../interfaces/Command";
import path from "path";
import { readdirSync } from "fs";

export class Bot {
  public commands = new Array<ApplicationCommandDataResolvable>();
  public commandsCollection = new Collection<string, Command>();

  public constructor(public client: Client) {
    client.login(process.env.TOKEN);

    this.client.on(Events.ClientReady, readyClient => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`)

      this.registerCommands();
      this.onInteractionCreate();
    });
  }

  private async registerCommands() {
    const rest = new REST().setToken(process.env.TOKEN!);

    const commandsPath = path.join(__dirname, "..", "commands");
    const commandFiles = readdirSync(commandsPath).filter(file => !file.endsWith(".map"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);
      const commandClass: Command = command.default;

      this.commands.push(commandClass.data);
      this.commandsCollection.set(commandClass.data.name, commandClass);
    }

    try {
      rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: this.commands })
    } catch(error: any) {
      console.error(error);
    } finally {
      console.log("Registered commands");
    }
  }

  private async onInteractionCreate() {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<any> => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commandsCollection.get(interaction.commandName);
      if (!command) return;

      try {
        command.execute(interaction);
      } catch(error) {
        console.error(error);
      } finally {
        console.log(`Command executed: ${command.data.name}`);
      }
    })
  }
}

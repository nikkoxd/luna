import { Client, Events } from "discord.js";

export class Bot {
  public constructor(public client: Client) {
    this.client.once(Events.ClientReady, readyClient => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`)
    });

    client.login(process.env.TOKEN);
  }
}

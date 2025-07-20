import { ButtonInteraction } from "discord.js";

export abstract class Button {
    abstract execute(interaction: ButtonInteraction): Promise<void>;

    protected constructor(public name: string) { }
}

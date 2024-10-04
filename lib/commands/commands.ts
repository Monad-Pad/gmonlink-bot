import { Bot } from "grammy";
import { MyContext } from "../../bot";

export async function setCommands(bot: Bot<MyContext>) {
    await bot.api.setMyCommands([
        { command: "start", description: "Start the bot" },
        { command: "projects", description: "View all projects" },
        { command: "project", description: "Usage: /project <slug> - view/manage a project" },
        { command: "cancel", description: "Cancels a function or action"},
        { command: "support", description: "Get support"}
    ]);
}
import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { botSettings } from "../../config";
import { ActSupabaseClient } from "../clients/supabase";

export async function supportCommand(bot: Bot<MyContext>, supabase: ActSupabaseClient) {
    bot.command("support", async (ctx) => {
        let message = `👋 Hey! If you need help, you can reach out to me on Twitter <a href="https://x.com/elliotdotsol">here</a>.`;
        await ctx.reply(message, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
    });

    bot.command("verify", async (ctx) => {
        const userId = ctx.from?.id!;
        if (userId !== botSettings.adminId) return;

        const projectSlug = ctx.message?.text?.split(" ")[1];
        if (!projectSlug) {
            await ctx.reply("Please provide a project slug.");
            return;
        }

        const { error } = await supabase.from("projects").update({ is_verified: true }).eq("slug", projectSlug);
        if (error) {
            await ctx.reply(`Error verifying project: ${error.message}`);
            return;
        }

        await ctx.reply(`Project ${projectSlug} verified successfully!`);
    });
}
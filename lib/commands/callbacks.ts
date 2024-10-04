import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { ActSupabaseClient } from "../clients/supabase";
import { conversations } from "@grammyjs/conversations";
import { activeLinkRecord, activeProjectRecord, transferProjectRecord } from "../records";

export async function handleCallbacks(bot: Bot<MyContext>, supabase: ActSupabaseClient) {
    bot.callbackQuery("create-project", async (ctx) => {
        await ctx.conversation.enter("create-project");
    });
    bot.callbackQuery("create-link", async (ctx) => {
        await ctx.conversation.enter("create-link");
    });
    bot.callbackQuery("transfer-project-accept", async (ctx) => {
        const userId = ctx.from!.id!;
        const { projectId, fromUserId } = transferProjectRecord[userId];

        if (!projectId) {
            return ctx.reply("No project to transfer");
        }

        await ctx.deleteMessage();
        const message = await ctx.reply("⏳ Transferring project...");
        const { error } = await supabase.from("projects").update({ user_id: userId }).eq("project_id", projectId);
        if (error) {
            await ctx.api.editMessageText(userId, message.message_id, "❌ Failed to transfer project");
            
        } else {
            await ctx.api.editMessageText(userId, message.message_id, "✅ Project transferred");
            await ctx.api.sendMessage(fromUserId, "✅ Project transfer accepted!");
        }
        delete transferProjectRecord[userId];
    });
    bot.callbackQuery("transfer-project-reject", async (ctx) => {
        const userId = ctx.from!.id!;
        const { fromUserId } = transferProjectRecord[userId];

        if (!fromUserId) {
            return ctx.reply("No project to transfer");
        }
        await ctx.deleteMessage()
        await ctx.reply("❌ Project transfer rejected");
        await ctx.api.sendMessage(fromUserId, "❌ Project transfer rejected!");
        delete transferProjectRecord[userId];
    });
    bot.callbackQuery("delete-project", async (ctx) => {
        const userId = ctx.from!.id!;
        const projectId = activeProjectRecord[userId];
        if (!projectId) {
            return ctx.reply("No active project");
        }
        
        await ctx.deleteMessage();
        const deleteMessage = await ctx.reply("⏳ Deleting project...");
        const { error } = await supabase.from("projects").delete().eq("project_id", projectId);
        if (error) {
            await ctx.api.editMessageText(userId, deleteMessage.message_id, "❌ Failed to delete project");
        } else {
            await ctx.api.editMessageText(userId, deleteMessage.message_id, "✅ Project deleted");
        }
    });
    bot.callbackQuery("cancel-delete-project", async (ctx) => {
        await ctx.deleteMessage();
        await ctx.reply("❌ Project deletion cancelled");
    });
    bot.callbackQuery("delete-link", async (ctx) => {
        const userId = ctx.from!.id!;
        const linkId = activeLinkRecord[userId];
        if (!linkId) {
            return ctx.reply("No active link");
        }
        
        await ctx.deleteMessage();
        const deleteMessage = await ctx.reply("⏳ Deleting link...");
        const { error } = await supabase.from("links").delete().eq("link_id", linkId);
        if (error) {
            await ctx.api.editMessageText(userId, deleteMessage.message_id, "❌ Failed to delete link");
        } else {
            await ctx.api.editMessageText(userId, deleteMessage.message_id, "✅ Link deleted");
        }
    });
    bot.callbackQuery("cancel-delete-link", async (ctx) => {
        await ctx.deleteMessage();
        await ctx.reply("❌ Link deletion cancelled");
    });
}
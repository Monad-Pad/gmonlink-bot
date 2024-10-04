import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { EditLinkType, editLink } from "../projects/links/edit-link";
import { ActSupabaseClient } from "../clients/supabase";
import { activeLinkRecord } from "../records";
import { selfDestructTimeout } from "../../config";

export async function replyToMessages(bot: Bot<MyContext>, supabase: ActSupabaseClient) {
    bot.on("message", async (ctx) => {
        const message = ctx.message;
        if (!message) return;

        const replyMessage = message.reply_to_message;
        if (!replyMessage) return;

        let type: EditLinkType | undefined;
        const linkId = activeLinkRecord[ctx.from?.id!];

        // Determine the type of edit based on the reply message text
        if (replyMessage.text?.includes("Please provide the new title for the link.")) {
            type = "title";
        } else if (replyMessage.text?.includes("Please provide the new description for the link.")) {
            type = "description";
        } else if (replyMessage.text?.includes("Please provide the new URL for the link.")) {
            type = "url";
        } else if (replyMessage.text?.includes("Please provide the new icon for the link.")) {
            type = "icon";
        } else if (replyMessage.text?.includes("Please provide the new order for the link. High numbers are shown first.")) {
            type = "order";
        } else if (replyMessage.text?.includes("Please provide the new category for the link.")) {
            type = "category";
        }

        if (!type) return;

        await ctx.api.deleteMessage(ctx.chat!.id, replyMessage.message_id);
        await ctx.deleteMessage();

        try {
            await editLink(linkId, type, message.text!, supabase);
            const successMsg =await ctx.reply(`✅ Successfully updated!`);
            // Delete the message after 5 seconds
            setTimeout(async () => {
                await ctx.api.deleteMessage(successMsg.chat.id, successMsg.message_id);
            }, selfDestructTimeout);
        } catch (error: any) {
            await ctx.reply(`❌ Failed to update.`);
        }
    });
}
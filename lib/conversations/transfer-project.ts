import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "../../bot";
import { activeProjectRecord, isInConversationRecord, lastTransferRequestRecord, transferProjectRecord } from "../records";
import { getProject, getProjectById } from "../projects/get-project";
import { Bot } from "grammy";
import { ActSupabaseClient } from "../clients/supabase";
import { sendTipMessage } from "./send-message";

type MyConversation = Conversation<MyContext>;

export async function transferProject(conversation: MyConversation, ctx: MyContext, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
    const userId = ctx.from?.id!;
    const projectId = activeProjectRecord[userId];
    isInConversationRecord[userId] = true

    if (!projectId) {
        return ctx.reply("No active project");
    }

    await sendTipMessage(ctx);

    await ctx.reply(`Forward a message from the user you want to transfer the project to. This user must have already used the bot before.`);

    const message = await conversation.waitFor(":forward_origin:user");

    if (!message) {
        return ctx.reply("No message forwarded");
    }

    // console.log(message.update.message);
    // @ts-ignore
    const forwardedUserId = message.update.message?.forward_from?.id;

    if (!forwardedUserId) {
        return ctx.reply("No user id found in the forwarded message");
    }

    const project = await getProjectById(projectId, userId, supabase);

    const lastTransferRequest = lastTransferRequestRecord[forwardedUserId];

    // once a user accepts a transfer request, the bot should wait 10 minutes before allowing another transfer request
    if (lastTransferRequest && Date.now() - lastTransferRequest.timestamp < 10 * 60 * 1000) {
        return ctx.reply("You must wait at least 10 minutes before requesting another transfer");
    }
    lastTransferRequestRecord[forwardedUserId] = {
        timestamp: Date.now(),
        fromUserId: userId,
    };

    try {
        await ctx.api.sendMessage(forwardedUserId, `@${ctx.from?.username} wants to transfer project: <b>${project.title}</b> to you.`, { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "Accept", callback_data: "transfer-project-accept" }], [{ text: "Reject", callback_data: "transfer-project-reject" }]] } });
        transferProjectRecord[forwardedUserId] = {
            projectId: projectId,
            fromUserId: userId,
        };
    } catch (error) {
        console.error(error);
        return ctx.reply("I can't send messages to that user. Make sure they've talked to me before.");
    }

    await ctx.reply("⏳ Transfer request sent, waiting for the other user to accept.");

    return;
}
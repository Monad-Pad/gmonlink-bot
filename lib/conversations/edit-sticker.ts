import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { ActSupabaseClient } from "../clients/supabase";
import { getProjectById } from "../projects/get-project";
import { activeProjectRecord, isInConversationRecord } from "../records";
import { sendTipMessage } from "./send-message";
import { Conversation } from "@grammyjs/conversations";

type MyConversation = Conversation<MyContext>;

export async function editSticker(conversation: MyConversation, ctx: MyContext, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
	const userId = ctx.from?.id!;
	const projectId = activeProjectRecord[userId];
	isInConversationRecord[userId] = true;

	if (!projectId) {
		return ctx.reply("No active project");
	}

	await sendTipMessage(ctx);

	const project = await getProjectById(projectId, userId, supabase);

	if (!project) {
		return ctx.reply("No active project");
	}

	const availableStickersResponse = await fetch("https://gmon.link/api/stickers");
	const availableStickersResult: any = await availableStickersResponse.json();
	const availableStickers: any[] = availableStickersResult.supportedImages;

	let message = `Reply with the name of the sticker you want to use on your page. Available stickers:\n`;
	message += "<blockquote expandable>";
	availableStickers.forEach((sticker: any, index: number) => {
		message += `<code>${sticker.name}</code>\n`;
	});
	message += "</blockquote>";
	await ctx.reply(message, { parse_mode: "HTML" });

	const sticker = await conversation.form.text(async (ctx) => {
		await ctx.reply("⚠️ Please provide a valid sticker.");
	});

	const selectedSticker = availableStickers.find(s => s.name === sticker);
	if (!selectedSticker) {
		await ctx.reply("⚠️ Please provide a valid sticker name from the list, exiting process...");
		return;
	}

	const { error } = await supabase.from("projects").update({ welcome_emoji: sticker }).eq("project_id", projectId);

	if (error) {
        console.log(error)
		await ctx.reply("⚠️ An error occurred while updating the sticker. Please try again.");
	}

	await ctx.reply("✅ Sticker updated successfully!");
    return;
}

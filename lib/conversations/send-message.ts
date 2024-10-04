import { Context } from "grammy";
import { isInConversationRecord } from "../records";

export async function sendTipMessage(ctx: Context) {
	const userId = ctx.from!.id!;

	await ctx.reply("<b>TIP:</b> You can use /cancel to exit this process at any time.", { parse_mode: "HTML" });
	delete isInConversationRecord[userId];

	return;
}
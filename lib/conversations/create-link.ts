import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "../../bot";
import { Bot } from "grammy";
import { ActSupabaseClient } from "../clients/supabase";
import { activeProjectRecord, isInConversationRecord } from "../records";
import { getProjects } from "../projects/get-projects";
import { getLinks } from "../projects/links/get-links";
import { isSocialUrl } from "../utils";
import { selfDestructTimeout } from "../../config";
import { sendTipMessage } from "./send-message";
import { getCategories } from "../projects/links/get-categories";

type MyConversation = Conversation<MyContext>;

const steps = 5;

export async function createLink(conversation: MyConversation, ctx: MyContext, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
	const userId = ctx.from!.id!;
	const projectId = activeProjectRecord[userId];
	isInConversationRecord[userId] = true

	if (!projectId) {
		return ctx.reply("No active project");
	}

	await sendTipMessage(ctx);

	await ctx.reply(`<code>[1/${steps}]</code>\nSure! Let's create a new link for the project.\n\nWhat's the title of the link?`, {
		parse_mode: "HTML",
	});
	const title = await conversation.form.text(async (ctx) => {
		await ctx.reply("Please provide a valid title.");
	});

	await ctx.reply(`<code>[2/${steps}]</code>\nGreat! <code>${title}</code> it is. Now, let's write a short description for the link.`, {
		parse_mode: "HTML",
	});
	const description = await conversation.form.text(async (ctx) => {
		await ctx.reply("Please provide a valid description.");
	});

	await ctx.reply(`<code>[3/${steps}]</code>\nFab! Let's add the URL for the link.`, {
		parse_mode: "HTML",
	});
	const url = await conversation.form.url(async (ctx) => {
		await ctx.reply("Please provide a valid URL.");
	});

    // let skipIcon = false;
	// let icon = null as string | null;
	// if (isSocialUrl(url)) {
	// 	icon = isSocialUrl(url);
    //     skipIcon = true;
	// }

	// if (!icon) {
	// 	await ctx.reply(`<code>[4/${steps}]</code>\nLet's pick an icon for the link. Reply with the name of the icon. Example: <code>arrow-up-right</code>`, {
	// 		parse_mode: "HTML",
	// 		reply_markup: {
	// 			inline_keyboard: [[{ text: "View icon library", url: "https://lucide.dev/icons/" }]],
	// 		},
	// 	});

	// 	icon = await conversation.form.text(async (ctx) => {
	// 		await ctx.reply("Please provide a valid icon.");
	// 	});
	// }

	const links = await getLinks(projectId, supabase);

	await ctx.reply(
		`<code>[4/${steps}]</code>\nPick what order you want the link to be in, you have ${links.length} links, order ${
			links.length + 1
		} would make it the <b>first</b> link in the list. Use <code>0</code> to ignore the order.`,
		{
			parse_mode: "HTML",
		}
	);
	const order = await conversation.form.number(async (ctx) => {
		await ctx.reply("Please provide a valid order, number like 1, 2, 3, etc.");
	});

	const categories = await getCategories(projectId, supabase);
	await ctx.reply(`<code>[5/${steps}]</code>\nDo you want to add this link to a category?\n\n${categories ? `You currently have these categories: <code>${categories.join(", ")}</code>\n\n` : ""}Reply with the name of the category or <code>none</code> if you don't want to add it to a category.`, {
		parse_mode: "HTML",
	});
	const category = await conversation.form.text(async (ctx) => {
		await ctx.reply("Please provide a valid category.");
	});

	const insertingMessage = await ctx.reply(`⏳ Creating link...`);
	const { error } = await supabase.from("links").insert({ title, description, url, project_id: projectId, order, category: category.toLowerCase() });

	if (error) {
		throw error;
	}

	await ctx.api.editMessageText(ctx.chat!.id, insertingMessage.message_id, "🎉 Link created successfully!");
	setTimeout(async () => {
		await ctx.api.deleteMessage(ctx.chat!.id, insertingMessage.message_id);
	}, selfDestructTimeout);

	return;
}

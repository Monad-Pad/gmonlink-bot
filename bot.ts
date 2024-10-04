import { Bot, Context, GrammyError, HttpError, session, SessionFlavor, Composer } from "grammy";
import { run } from "@grammyjs/runner";
import dotenv from "dotenv";
import { createApiClient } from "./lib/clients/supabase";
import { conversations, createConversation, ConversationFlavor } from "@grammyjs/conversations";
import { getUsername } from "./lib/utils";
import { botSettings } from "./config";
import { startCommand } from "./lib/commands/start-command";
import { createProject } from "./lib/conversations/create-project";
import { handleCallbacks } from "./lib/commands/callbacks";
import { createLink } from "./lib/conversations/create-link";
import { projectCommand } from "./lib/commands/project-command";
import { setCommands } from "./lib/commands/commands";
import { replyToMessages } from "./lib/commands/reply-to";
import { createButtons } from "./lib/conversations/create-buttons";
import { editProject } from "./lib/conversations/edit-project";
import { transferProject } from "./lib/conversations/transfer-project";
import { supportCommand } from "./lib/commands/support-command";
import { isInConversationRecord } from "./lib/records";
import { editImage } from "./lib/conversations/edit-image";
import { editSticker } from "./lib/conversations/edit-sticker";

dotenv.config();

export type MyContext = Context & SessionFlavor<{}> & ConversationFlavor;

const cooldowns = new Map<number, number>();
const COOLDOWN_DURATION = 1000; // 1 second

const cooldownMiddleware = async (ctx: Context, next: () => Promise<void>) => {
	if (!ctx.message || !ctx.message.text) {
		return next();
	}

	const userId = ctx.from?.id;
	if (!userId) return next();

	const lastUse = cooldowns.get(userId) || 0;
	const now = Date.now();
	const timeElapsed = now - lastUse;

	if (timeElapsed < COOLDOWN_DURATION) {
		const remainingTime = Math.ceil((COOLDOWN_DURATION - timeElapsed) / 1000);
		return ctx.reply(`Please wait ${remainingTime} second(s) before sending another message.`);
	}

	cooldowns.set(userId, now);
	return next();
};

const conversationManager = new Composer<MyContext>();

conversationManager.command("cancel", async (ctx) => {
	await ctx.reply("✅ Cancelled the process successfully.");
	await ctx.conversation.exit();
});

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

bot.use(session({ initial: () => ({}) }));
bot.use(cooldownMiddleware);

const supabase = createApiClient();

bot.use(conversations());
bot.use(conversationManager);

const conversationTimeOut = 300000; // 5 minutes

const conversationHandlers = [
	{ id: "create-project", handler: createProject },
	{ id: "create-link", handler: createLink },
	{ id: "create-buttons", handler: createButtons },
	{ id: "edit-project", handler: editProject },
	{ id: "transfer-project", handler: transferProject },
	{ id: "edit-image", handler: editImage },
	{ id: "edit-sticker", handler: editSticker },
];

conversationHandlers.forEach(({ id, handler }) => {
	bot.use(createConversation(
		// @ts-ignore
		(conversations, ctx) => handler(conversations, ctx, supabase, bot),
		{ id, maxMillisecondsToWait: conversationTimeOut }
	));
});

(async () => {
	await setCommands(bot);
	await startCommand(bot, supabase);
	await projectCommand(bot, supabase);
	await supportCommand(bot, supabase);
	await handleCallbacks(bot, supabase);
	await replyToMessages(bot, supabase);
})();

bot.catch(async (err) => {
	const ctx = err.ctx;
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	console.error("Details:");
	console.error("Query:", ctx.msg?.text, "not found!");

	if (!(err.error instanceof GrammyError)) {
		ctx.reply("An error occurred. Try again later, contact the developer if the problem persists.");
	}

	const username = await getUsername(ctx.from!.id!, bot);
	await bot.api.sendMessage(botSettings.errorsChannelId, `User: ${username}, error: ${err.message}.\n\nwhat: ${err.error}.`);
	const e = err.error;
	if (e instanceof GrammyError) {
		console.error("Error in request:", e.description);
	} else if (e instanceof HttpError) {
		console.error("Could not contact Telegram:", e);
	} else {
		console.error("Unknown error:", e);
	}
});

console.log("Bot running.");

run(bot);

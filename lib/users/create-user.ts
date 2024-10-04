import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { getUsername } from "../utils";
import { ActSupabaseClient } from "../clients/supabase";
import { botSettings } from "../../config";

export async function createUser(userId: number, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
	const chatMember = await bot.api.getChatMember(userId, userId);
	const username = chatMember.user.username;

	if (!username || username === undefined) {
		await bot.api.sendMessage(userId, "Set a username in your Telegram settings before using this bot.");
		return;
	}

    const { count } = await supabase.from("users").select("*", { count: "exact", head: true });

	const { data, error } = await supabase.from("users").insert({ user_id: userId, username }).select("*");

	if (error || !data) {
		throw new Error("An error occurred while creating the user." + error.message);
	}

	await bot.api.sendMessage(
		userId,
		`👋 Welcome to gmon.link, ${username} (#${count! + 1})! Your account was created successfully.\n\nSince you're new here, start with one of the following:`,
		{ reply_markup: { inline_keyboard: [[{ text: "➕ Create Project", callback_data: "create-project" }], [{ text: "📄 Read Guide", url: "https://x.com/elliotdotsol/status/1829843634579034350" }]] } }
	);

    await bot.api.sendMessage(botSettings.alertsChannelId, `${username} (#${count! + 1}) created an account.`);

	return data;
}

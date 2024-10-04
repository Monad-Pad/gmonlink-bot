import { Bot } from "grammy";
import { MyContext } from "../bot";
import { ActSupabaseClient } from "./clients/supabase";

export async function getUsername(userId: number, bot: Bot<MyContext>) {
	let username: any = "";
	const chatMember = await bot.api.getChatMember(userId, userId);
	if (chatMember.user.username !== undefined) {
		username = "@" + chatMember.user.username;
		return username;
	} else {
		return userId.toString();
	}
}

export async function createSlug(text: string, supabase: ActSupabaseClient) {
    let slug = text.toLowerCase().replace(/ /g, "-");
    const { data, error } = await supabase.from("projects").select("slug").eq("slug", slug).maybeSingle();
    
    if (error || data) {
        // If the slug already exists, add a random 3 character string to the slug
        const randomString = Math.random().toString(36).substring(7);
        slug = `${slug}-${randomString}`;
    }

    return slug;
}

export async function urlToBlob(url: string): Promise<Blob> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const blob = await response.blob();
		return blob;
	} catch (error) {
		console.error("Error:", error);
		throw error;
	}
}

export function isSocialUrl(url: URL): string | null {

    const socialUrls = ["twitter.com", "x.com", "linkedin.com", "facebook.com", "instagram.com", "tiktok.com", "discord.com", "discord.gg", "t.me"];
    const socialUrl = socialUrls.find(socialUrl => url.toString().includes(socialUrl));
    return socialUrl || null;
}

export function getBotLink(bot: Bot<MyContext>) {
    const botLink = `https://t.me/${bot.botInfo.username}`;
    return botLink;
}
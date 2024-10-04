import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "../../bot";
import { activeProjectRecord, isInConversationRecord } from "../records";
import { getProject, getProjectById } from "../projects/get-project";
import { Bot } from "grammy";
import { ActSupabaseClient } from "../clients/supabase";
import * as mime from "mime-types";
import { sendTipMessage } from "./send-message";

type MyConversation = Conversation<MyContext>;

const botToken = process.env.BOT_TOKEN!;

export async function editImage(conversation: MyConversation, ctx: MyContext, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
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

	await ctx.reply(`Upload a new image`, {
		parse_mode: "HTML",
	});

	const { message } = await conversation.waitFor(["message:photo"]);

	if (!message || !message.photo) {
		await ctx.reply("Please provide a valid image.");
		return;
	}

	const uploadingMessage = await ctx.reply("⏳ We're uploading your image...");
	const slug = project.slug;

	let imageData: any;
	try {
		const imageId = message.photo[message.photo.length - 1].file_id;
		const image = await bot.api.getFile(imageId);
		const projectImage = `https://api.telegram.org/file/bot${botToken}/${image.file_path}`;

		// Fetch the image as an ArrayBuffer
		const response = await fetch(projectImage);
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Get file extension and MIME type
		if (!image.file_path) throw new Error("No file path found in the image.");

		const fileExtension = image.file_path.split(".").pop() || "jpg";
		const contentType = mime.lookup(fileExtension) || "image/jpeg";

		const fileName = `${slug}.${fileExtension}`;

		const { data: imageRes, error } = await supabase.storage.from("gmon.link").upload(fileName, buffer, {
			upsert: true,
			contentType: contentType,
		});

		if (error) throw error;

		imageData = imageRes;

		const imageUrl = imageData.fullPath;

		const { error: uploadErr } = await supabase.from("projects").update("avatar_url", imageUrl);

		if (uploadErr) {
			throw uploadErr;
		}

		await ctx.api.editMessageText(
			ctx.chat!.id,
			uploadingMessage.message_id,
			"✅ Image uploaded successfully! (it may take a moment to reflect on the page)"
		);

		return;
	} catch (error) {
		console.error("Error:", error);
		await ctx.api.editMessageText(ctx.chat!.id, uploadingMessage.message_id, "❌ Sorry, there was an error uploading your image.");
		return;
	}

	return;
}

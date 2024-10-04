import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "../../bot";
import { activeProjectRecord, isInConversationRecord } from "../records";
import { getProject, getProjectById } from "../projects/get-project";
import { Bot } from "grammy";
import { ActSupabaseClient } from "../clients/supabase";
import { sendTipMessage } from "./send-message";

type MyConversation = Conversation<MyContext>;

const steps = 2;

export async function editProject(conversation: MyConversation, ctx: MyContext, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
    const userId = ctx.from?.id!;
    const projectId = activeProjectRecord[userId];
    isInConversationRecord[userId] = true

    if (!projectId) {
        return ctx.reply("No active project");
    }

    await sendTipMessage(ctx);

    const project = await getProjectById(projectId, userId, supabase);

    let newTitle = ""
    let newDescription = ""

    if (!project) {
        return ctx.reply("No active project");
    }

    await ctx.reply(`<code>[1/${steps}]</code>\nReply with a new title for the project. (skip to keep the same title)`, {
		parse_mode: "HTML",
	});

    const titleRes = await conversation.form.text(async (ctx) => {
        await ctx.reply("Please provide a valid title.");
    });

    if (titleRes !== "skip") {
        newTitle = titleRes;
    }

    await ctx.reply(`<code>[2/${steps}]</code>\nReply with a new description for the project. (skip to keep the same description)`, {
		parse_mode: "HTML",
	});

    const descriptionRes = await conversation.form.text(async (ctx) => {
        await ctx.reply("Please provide a valid description.");
    });

    if (descriptionRes !== "skip") {
        newDescription = descriptionRes;
    }

    const updateMessage = await ctx.reply("⏳ Updating project...");
    let error: any = null;
    if (newTitle.length > 0) {
        const { error: projectErr } = await supabase.from("projects").update({ title: newTitle }).eq("project_id", projectId);
        if (projectErr) error = projectErr;
    }

    if (newDescription.length > 0) {
        const { error: descriptionErr } = await supabase.from("projects").update({ description: newDescription }).eq("project_id", projectId);
        if (descriptionErr) error = descriptionErr;
    }

    if (error) {
        return ctx.api.editMessageText(ctx.chat!.id, updateMessage.message_id, "❌ Error updating project");
    }

    await ctx.api.editMessageText(ctx.chat!.id, updateMessage.message_id, `✅ Project updated\n\n<a href="https://gmon.link/${project.slug}">https://gmon.link/${project.slug}</a>`, {
        parse_mode: "HTML", link_preview_options: { is_disabled: true  },
    });

    return;
}
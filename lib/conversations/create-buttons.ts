import { Conversation } from "@grammyjs/conversations";
import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { ActSupabaseClient } from "../clients/supabase";
import { activeProjectRecord, isInConversationRecord } from "../records";
import { ButtonType } from "../types/sections";
import { selfDestructTimeout } from "../../config";
import { sendTipMessage } from "./send-message";

type MyConversation = Conversation<MyContext>;

const steps = 4;

export async function createButtons(conversation: MyConversation, ctx: MyContext, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
    const userId = ctx.from!.id!;
    const projectId = activeProjectRecord[userId];
    isInConversationRecord[userId] = true

    if (!projectId) {
        return ctx.reply("No active project");
    }

    await sendTipMessage(ctx);

    await ctx.reply(`<code>1/${steps}</code>\n<b>Primary Button</b>\nWhat text do you want to display on the button?`, {
        parse_mode: "HTML",
    });

    const primaryText = await conversation.form.text(async (ctx) => {
        await ctx.reply("Please provide a valid text.");
    });
    
    await ctx.reply(`<code>2/${steps}</code>\n<b>Primary Button</b>\nWhat URL do you want to link to?`, {
        parse_mode: "HTML",
    });

    const primaryUrl = await conversation.form.text(async (ctx) => {
        await ctx.reply("Please provide a valid URL.");
    });
    
    await ctx.reply(`<code>3/${steps}</code>\n<b>Secondary Button</b>\nWhat text do you want to display on the button? (type skip to not add a secondary button)`, {
        parse_mode: "HTML",
    });

    const secondaryText = await conversation.form.text(async (ctx) => {
        await ctx.reply("Please provide a valid text.");
    });

    if (secondaryText === "skip") {
        const buttons: ButtonType[] = [
            {
                label: primaryText,
                url: primaryUrl,
            },
        ];

        const insertingMessage = await ctx.reply("⏳ Creating button...");
        
        const {error} = await supabase.from("projects").update({buttons}).eq("project_id", projectId);

        if (error) {
            return ctx.api.editMessageText(ctx.chat!.id, insertingMessage.message_id, "❌ Error creating button");
        }

        ctx.api.editMessageText(ctx.chat!.id, insertingMessage.message_id, "🎉 Button created successfully");
        setTimeout(async () => {
            await ctx.api.deleteMessage(ctx.chat!.id, insertingMessage.message_id);
        }, selfDestructTimeout);
        return;
    }
    
    await ctx.reply(`<code>4/${steps}</code>\n<b>Secondary Button</b>\nWhat URL do you want to link to?`, {
        parse_mode: "HTML",
    });

    const secondaryUrl = await conversation.form.text(async (ctx) => {
        await ctx.reply("Please provide a valid URL.");
    });

    const buttons: ButtonType[] = [
        {
            label: primaryText,
            url: primaryUrl,
        },
        {
            label: secondaryText,
            url: secondaryUrl,
        },
    ];

    const insertingMessage = await ctx.reply("⏳ Creating buttons...");
    
    const {error} = await supabase.from("projects").update({buttons}).eq("project_id", projectId);

    if (error) {
        return ctx.api.editMessageText(ctx.chat!.id, insertingMessage.message_id, "❌ Error creating buttons");
    }

    ctx.api.editMessageText(ctx.chat!.id, insertingMessage.message_id, "🎉 Buttons created successfully");
    setTimeout(async () => {
        await ctx.api.deleteMessage(ctx.chat!.id, insertingMessage.message_id);
    }, selfDestructTimeout);

    return;
}
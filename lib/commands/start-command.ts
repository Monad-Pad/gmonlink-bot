import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { getUser } from "../users/get-user";
import { ActSupabaseClient } from "../clients/supabase";
import { getLink } from "../projects/links/get-link";
import { Menu } from "@grammyjs/menu";
import { activeLinkRecord, activeProjectRecord, projectMessageIdRecord } from "../records";
import { createProjectMenu, createProjectMessage } from "./project-command";
import { getProject } from "../projects/get-project";
import { createToken } from "../clients/auth";
import { platformUrl } from "../../config";


export async function startCommand(bot: Bot<MyContext>, supabase: ActSupabaseClient) {
    const linkMenu = createLinkMenu();
    bot.use(linkMenu);
    const projectMenu = createProjectMenu(bot, supabase);
    bot.use(projectMenu);

    bot.command("start", async (ctx) => {
        const userId = ctx.from?.id!;
        const user = await getUser(userId, supabase, bot);
        if (user?.new) return;

        const startParam = ctx.message?.text?.split(" ")[1];
        if (startParam) {
            await ctx.deleteMessage();
            const [type, id] = startParam.split("_");
            console.log(type, id);
            if (type === "edit" && id) {
                const link = await getLink(id, supabase);
                if (link) {
                    activeLinkRecord[ctx.from?.id!] = link.link_id;
                    let message = `<b>Manage Link</b>\n\n`;
                    message += `Title: <code>${link.title}</code>\n`;
                    message += `Description: <code>${link.description}</code>\n`;
                    message += `URL: <code>${link.url}</code>\n`;
                    message += `Icon: <code>${link.icon}</code>\n`;
                    message += `Order: <code>${link.order}</code>\n`;
                    await ctx.reply(message, { parse_mode: "HTML", link_preview_options: { is_disabled: true }, reply_markup: linkMenu });
                }
            } else if (type === "project" && id) {
                const project = await getProject(id, userId, supabase);
                if (project) {
                    activeProjectRecord[ctx.from?.id!] = project.project_id;
                    const message = await createProjectMessage(project, bot, supabase);
                    const msg = await ctx.reply(message, { parse_mode: "HTML", link_preview_options: { is_disabled: true }, reply_markup: projectMenu });
                    projectMessageIdRecord[ctx.from?.id!] = msg.message_id;
                }
            }
            return;
        }

        // const token = createToken({ userId });
        // const loginUrl = `localhost:3000/login?access=${token}`;
        // await ctx.reply("👋 Welcome to gmon.link! Use /projects to get started.", { reply_markup: { inline_keyboard: [[{ text: "Login to gmon.link", url: loginUrl }]] } });
        await ctx.reply(`👋 Welcome to gmon.link! Use /projects to get started.`, { parse_mode: "HTML" });
    });
}

function createLinkMenu() {
    const menu = new Menu("link-menu");

    menu.text("✏️ Edit URL", async (ctx) => {
        await ctx.reply("Please provide the new URL for the link.", { reply_markup: { force_reply: true } });
    }).row();

    menu.text("📝 Edit title", async (ctx) => {
        await ctx.reply("Please provide the new title for the link.", { reply_markup: { force_reply: true } });
    }).row();

    menu.text("🖊️ Edit description", async (ctx) => {
        await ctx.reply("Please provide the new description for the link.", { reply_markup: { force_reply: true } });
    }).row();

    menu.text("🔖 Edit category", async (ctx) => {
        await ctx.reply("Please provide the new category for the link.", { reply_markup: { force_reply: true } });
    }).row();

    // menu.text("🎨 Edit icon", async (ctx) => {
    //     await ctx.reply("Please provide the new icon for the link.", { reply_markup: { force_reply: true } });
    // }).row();

    menu.text("🔢 Edit order", async (ctx) => {
        await ctx.reply("Please provide the new order for the link. High numbers are shown first.", { parse_mode: "HTML", reply_markup: { force_reply: true } });
    }).row();

    menu.text("🗑️ Delete link", async (ctx) => {
        await ctx.reply("Are you sure you want to delete this link?\n\n<b>Note:</b> This action cannot be undone.", {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Yes", callback_data: "delete-link" }],
                    [{ text: "No", callback_data: "cancel-delete-link" }],
                ],
            },
        });
    }).row();

    menu.text("⬅️ Back", async (ctx) => {
        await ctx.deleteMessage();
    }).row();
    
    return menu;
}
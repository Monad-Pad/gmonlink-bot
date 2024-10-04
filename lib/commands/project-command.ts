import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { ActSupabaseClient } from "../clients/supabase";
import { Menu } from "@grammyjs/menu";
import { activeProjectRecord, projectMessageIdRecord, projectRecord } from "../records";
import { getProjectBySlug, getProjects } from "../projects/get-projects";
import { getBotLink } from "../utils";
import { getCategories } from "../projects/links/get-categories";
import { getProject, getProjectById } from "../projects/get-project";

export async function createProjectMessage(project: any, bot: Bot<MyContext>, supabase: ActSupabaseClient) {
	const categories = await getCategories(project.project_id, supabase);
    let message = `<b>${project.title}</b>\n${project.description}`;

    message += "\n\n<b>Links by category</b>";
    if (project.links && project.links.length > 0) {
        for (const category of categories) {
                message += `\n\n<b>${category.charAt(0).toUpperCase() + category.slice(1)}</b>`;
                for (const link of project.links.filter((link: any) => link.category === category)) {
                    message += `\n<a href="${link.url}">${link.title}</a> - <a href="${getBotLink(bot)}?start=edit_${link.link_id}">[Edit]</a>`;
            }
        }
    } else {
        message += "\n<i>No links yet</i>";
    }

	message += "\n\n<b>Buttons</b>";
	if (project.buttons && project.buttons.length > 0) {
		for (const button of project.buttons) {
			message += `\n<a href="${button.url}">${button.label}</a>`;
		}
	} else {
		message += "\n<i>No buttons yet</i>";
	}

	message += "\n\n<b>Selected Sticker</b>";
	if (project.welcome_emoji) {
		message += `\n${project.welcome_emoji}`;
	} else {
		message += "\n<i>No sticker yet</i>";
	}

	message += `\n\n<a href="https://gmon.link/${project.slug}">gmon.link/${project.slug}</a>`;

    return message;
}

export function createProjectMenu(bot: Bot<MyContext>, supabase: ActSupabaseClient) {
	const menu = new Menu<MyContext>("project");

	menu.text("📝 Edit project", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}

		await ctx.conversation.enter("edit-project");
	}).row();

	menu.text("🖼️ Edit image", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}

		await ctx.conversation.enter("edit-image");
	}).row();

	menu.text("🎨 Edit sticker", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}

		await ctx.conversation.enter("edit-sticker");
	}).row();

	menu.text("🔗 Create a new link", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}

		await ctx.conversation.enter("create-link");
	}).row();

	menu.text("🔘 Add/edit button(s)", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}

		await ctx.conversation.enter("create-buttons");
	}).row();

	menu.text("✅ Verify page", async (ctx) => {
		let message = `✅ Become a verified page on gmon.link!\n\nStep 1: Follow <a href="https://x.com/monadpad">Monad Pad</a> on Twitter.\nStep 2: Reach out to <a href="https://x.com/elliotdotsol">me</a> on Twitter.\nStep 3: Provide your gmon.link.\nStep 4: Wait for your page to be approved.`;
        await ctx.reply(message, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
	}).row();

	menu.text("👋 Transfer project", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}

		await ctx.conversation.enter("transfer-project");
	}).row();

	menu.text("🗑️ Delete project", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}

		await ctx.reply("Are you sure you want to delete this project? <b>This action cannot be undone.</b>", { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "Confirm Delete", callback_data: "delete-project" }], [{ text: "Cancel Delete", callback_data: "cancel-delete-project" }]] } });
	}).row();

	menu.text("🔄 Refresh", async (ctx) => {
		const userId = ctx.from!.id!;

		const projectId = activeProjectRecord[userId];

		if (!projectId) {
			return ctx.reply("No active project");
		}
		
		const messageId = projectMessageIdRecord[userId];
		if (!messageId) {
			return ctx.reply("No active project message");
		}

		const project = await getProjectById(projectId, userId, supabase);
		const message = await createProjectMessage(project, bot, supabase);
		try {
			await ctx.editMessageText(message, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
		} catch (error) {
			// console.error(error);
		}
	});

	return menu;
}

export async function projectCommand(bot: Bot<MyContext>, supabase: ActSupabaseClient) {
	const menu = createProjectMenu(bot, supabase);
	bot.use(menu);

	bot.command("project", async (ctx) => {
		const slug = ctx.message?.text?.split(" ")[1];
		const userId = ctx.from!.id;

		if (!slug) {
			return ctx.reply("❌ Incorrect command usage. Please use /project <slug>. Example: /project my-project");
		}

		const project = await getProjectBySlug(slug, userId, supabase);

		if (!project) {
			return ctx.reply(`❌ Couldn't find project with slug <b>${slug}</b>. Please double check the slug and try again.`, { parse_mode: "HTML" });
		}

		activeProjectRecord[userId] = project.project_id;

        const message = await createProjectMessage(project, bot, supabase);

		const msg = await ctx.reply(message, { parse_mode: "HTML", reply_markup: menu, link_preview_options: { is_disabled: true } });
		projectMessageIdRecord[userId] = msg.message_id;
	});

	bot.command("projects", async (ctx) => {
		const userId = ctx.from!.id;
		const projects = await getProjects(userId, supabase);
		let message = "<b>Projects</b>";
		if (projects.length === 0) {
			message += "\n<i>☹️ No projects yet</i>";
		} else {
			let i = 1;
			for (const project of projects) {
				message += `\n${i}. <a href="https://gmon.link/${project.slug}">${project.title}</a> - <a href="${getBotLink(bot)}?start=project_${project.slug}">[Edit]</a>`;
                i++;
			}
		}
		await ctx.reply(message, { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "🚀 Create a new project", callback_data: "create-project" }]] }, link_preview_options: { is_disabled: true } });
	});
}

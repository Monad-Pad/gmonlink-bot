import dotenv from "dotenv";

dotenv.config();

export const botSettings = {
	alertsChannelId: -1002233703001,
	errorsChannelId: -1002186808429,
	adminId: 6585782196
};

export const selfDestructTimeout = 8000;

export const botMode = process.env.BOT_MODE || "PRODUCTION";

export const platformUrl = botMode === "PRODUCTION" ? "https://www.gmon.link" : "http://localhost:3000";

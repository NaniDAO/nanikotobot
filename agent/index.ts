import { config } from "dotenv";
import { initDiscord } from "@/discord/";
import { initTelegram } from "@/telegram/";

config();

export const isDev = process.env.NODE_ENV === "dev";

initTelegram();

initDiscord();


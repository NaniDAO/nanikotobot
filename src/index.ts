import { handleNewMessage } from "./telegram";
import { createTelegramBot } from "./telegram/utils";

const bot = createTelegramBot();

bot.start();

bot.on("message", async (ctx) => handleNewMessage(ctx));

bot.catch(console.error);

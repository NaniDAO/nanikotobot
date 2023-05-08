import { handleNewMessage } from "./telegram";
import { createTelegramBot } from "./telegram/utils";

const bot = createTelegramBot();

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

bot.start();

bot.on("message", async (ctx) => handleNewMessage(ctx));

bot.catch(console.error);


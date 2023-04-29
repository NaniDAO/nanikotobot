import { Bot } from "grammy";
import { config } from "dotenv";
import { getChatCompletion } from "./openai";

config()

const bot = new Bot(process.env.TELEGRAM_TOKEN!);

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.on("message", async (ctx) => {
  const message = ctx.message.text
  const author = await ctx.getAuthor().then((author) => {
    console.log(author.user.username);
    return author.user.username;
  });

  if (!message) {
    return;
  }

  if (message.toLowerCase().includes("nani")) { // to make it more conversational 
    const response = await getChatCompletion({
      message: {
        role: "user",
        name: author,
        content: message,
      }
    })

    ctx.reply(response);
  }
});

bot.start();

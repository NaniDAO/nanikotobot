import { config } from "dotenv";
import { ChatCompletionRequestMessage } from "openai";
import {
  createMessageToSave,
  createTelegramBot,
  textAdmin,
} from "@/telegram/utils";
import { Context } from "grammy";
import { updateHistory, getHistory, getHistoricalContext } from "./history";
import { addToNani } from "@/memory/utils";
import { INVALID_GROUP } from "@/constants";
import { getReply } from "@/commands/reply";

config();

const validateMessage = (ctx: Context) => {
  if (!ctx.message || !ctx.chat) {
    throw new Error("No Message or Chat!");
  }

  const message = ctx.message.text;
  if (!message || message.startsWith(".")) {
    console.log("Nani will not reply to this message.");
    return false;
  }

  return true;
};

const validateChat = (ctx: Context) => {
  let groupId = process.env.TELEGRAM_CHAT_ID;
  if (!groupId) {
    throw new Error("TELEGRAM_CHAT_ID is not configured!");
  }
  let adminId = process.env.ADMIN_CHAT_ID;
  if (!adminId) {
    throw new Error("ADMIN_CHAT_ID is not configured!");
  }

  if (
    ctx?.chat?.id.toString() != groupId.toString() &&
    ctx?.chat?.id.toString() != adminId.toString()
  ) {
    ctx.reply(INVALID_GROUP);
    return false;
  }

  return true;
};

export const handleNewMessage = async (ctx: Context) => {
  try {
    if (!validateMessage(ctx) || !validateChat(ctx)) {
      return;
    }

    const message = ctx?.message?.text as string;
    const date = (await ctx?.message?.date) as number;
    const author = await ctx.getAuthor();

    updateHistory(author.user.username ?? "", message, date);
    await addToNani(
      createMessageToSave({ author: author.user.username ?? "bot", message }),
      "telegram"
    );

    let messageChain: ChatCompletionRequestMessage[] = [];
    let msgHistory = await getHistory(3);

    msgHistory.forEach((msg) => {
      messageChain.push({
        role: "user",
        content: msg.message,
        name: msg.username,
      });
    });

    const response = await getReply({
      platform: "telegram",
      messages: [...messageChain],
    });

    const reply = await ctx.api.sendMessage(ctx?.chat?.id ?? "", response, {
      reply_to_message_id: ctx?.message?.message_id,
    });

    if (response.length > 0) {
      await addToNani(
        createMessageToSave({ message: response, author: "@nanikotobot" }),
        "telegram"
      );
    }
    
    updateHistory(reply.from?.username ?? "", response, reply.date);
  } catch (e) {
    console.error(e);
    await textAdmin(
      ctx,
      `Error @nerderlyne -> ${
        e instanceof Error ? e?.message : "Unknown Error"
      }`
    );
  }
};

export function initTelegram() {
  const bot = createTelegramBot();

  process.once("SIGINT", () => bot.stop());
  process.once("SIGTERM", () => bot.stop());

  bot.start();

  bot.on("message", async (ctx) => handleNewMessage(ctx));

  bot.catch(console.error);
}

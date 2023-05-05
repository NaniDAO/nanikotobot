import { config } from "dotenv";
import { getChatCompletion } from "../llm/openai";
import {
  ChatCompletionRequestMessageWithTimestamp,
  getRelevantTelegramHistory,
  storeEmbeddingsWithMetadata,
} from "../memory";
import { TELEGRAM_SYSTEM_PROMPT } from "./prompt";
import { ChatCompletionRequestMessage } from "openai";
import { summarizeHistoricalContext } from "./summarize";
import { createTelegramBot, textAdmin } from "@/telegram/utils";
import { Context } from "grammy";
import { interpolateTemplate } from "@/llm/utils";

config();

const bot = createTelegramBot();

const handleNewMessage = async (
  ctx: Context
) => {
  try {
    if (!ctx.message) {
      throw new Error("No Message!");
    }

    if (!ctx.chat) {
      throw new Error("No Chat!");
    }

    console.log("Chat Room ->", ctx.chat.id);

    const message = ctx.message.text;
    const author = await ctx.getAuthor();

    if (!message) {
      return;
    }

    let groupId = process.env.TELEGRAM_CHAT_ID;
    if (!groupId) {
      throw new Error("TELEGRAM_CHAT_ID is not configured!");
    }

    if (ctx.chat.id.toString() != groupId) {
      ctx.reply("♡ JOIN NANI DAO ---> https://t.me/+NKbETPq0J9UyODk9");
      return;
    }

    await storeEmbeddingsWithMetadata({
      document: message,
      metadata: {
        content: message,
        username: author.user.username,
        user_id: author.user.id,
        id: ctx.message.message_id,
        timestamp: ctx.message.date,
      },
      indexName: "nani-agi",
      namespace: "telegram",
    });

    const historicalContext: ChatCompletionRequestMessageWithTimestamp[] =
      await getRelevantTelegramHistory({
        query: message.toLowerCase(),
        secondsAgo: 60,
      });

    console.log("Generated History ->", historicalContext);

    let messageChain: ChatCompletionRequestMessage[] = [];
    if (ctx.message.reply_to_message?.text) {
      messageChain.push({
        role: "user",
        content: ctx.message.reply_to_message.text,
        name: ctx.message?.reply_to_message?.from?.username,
      });
    }

    messageChain.push({
      role: "user",
      content: message,
      name: author.user.username,
    });

    const relevantHistoricalContext =
      historicalContext && historicalContext.length > 0
        ? await summarizeHistoricalContext({
            historicalContext,
            query: messageChain.map((message) => message.content).join("\n"),
          })
        : "";

    let streamed_text = "";
    const response = await getChatCompletion({
      messages: [...messageChain],
      system_prompt: interpolateTemplate(TELEGRAM_SYSTEM_PROMPT, {
        context: relevantHistoricalContext,
      }),
      model: "gpt-4",
      callback: (message) => {
        console.clear();
        streamed_text += message;
        console.log(streamed_text);
      },
    });

    const reply = await bot.api.sendMessage(ctx.chat.id, response, {
      reply_to_message_id: ctx.message.message_id,
    });

    if (response.length > 0) {
      await storeEmbeddingsWithMetadata({
        document: response,
        metadata: {
          content: response,
          username: reply.from?.username,
          user_id: reply.from?.id,
          id: reply.message_id,
          timestamp: reply.date,
        },
        indexName: "nani-agi",
        namespace: "telegram",
      });
    }
  } catch (e) {
    console.error(e);
    await textAdmin(
      `Error @nerderlyne -> ${
        e instanceof Error ? e?.message : "Unknown Error"
      }`
    );
  }
};

bot.on("message", async (ctx) => {
 
});

export const initalizeTelegramBot = async () => {
  try {
    const bot = createTelegramBot();

    bot.on("message", async (ctx) => handleNewMessage(ctx));

    bot.start();

    console.log("Telegram Bot Started!");

    bot.catch(console.error);
  } catch (e) {
    console.error(e);
    await textAdmin(
      `Error @nerderlyne -> ${
        e instanceof Error ? e?.message : "Unknown Error"
      }`
    );
  }
};
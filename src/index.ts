import { config } from "dotenv";
import { getChatCompletion } from "./openai";
import {
  ChatCompletionRequestMessageWithTimestamp,
  getRelevantTelegramHistory,
  storeEmbeddingsWithMetadata,
} from "./memory";
import { getSystemPrompt } from "./system_prompt";
import { ChatCompletionRequestMessage } from "openai";
import { summarizeHistoricalContext } from "./summarize";
import { bot, textAdmin } from "./telegram";

config();

bot.on("message", async (ctx) => {
  console.log("Chat Room ->", ctx.msg.chat.id);

  try {
    const message = ctx.message.text;
    const author = await ctx.getAuthor();

    if (!message) {
      return;
    }

    if (ctx.chat.id !== -958064712) {
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

    if (message.toLowerCase().includes("nani")) {
      const reply = await ctx.reply('💭', {
        reply_to_message_id: ctx.message.message_id,
      });

      const historicalContext: ChatCompletionRequestMessageWithTimestamp[] =
        await getRelevantTelegramHistory({
          query: message,
          secondsAgo: 60,
        });

      ctx.editMessageText("🧠")
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

      ctx.editMessageText("✍🏼")
      const relevantHistoricalContext =
        historicalContext && historicalContext.length > 0
          ? await summarizeHistoricalContext({
            historicalContext,
            query: messageChain.map((message) => message.content).join("\n"),
          })
          : "";

      let streamed_text = ''
      const response = await getChatCompletion({
        messages: [...messageChain],
        system_prompt: getSystemPrompt(relevantHistoricalContext),
        callback: (msg: string) => {
          streamed_text += msg
          ctx.editMessageText(streamed_text)
        }
      });

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
    await textAdmin(`Error @nerderlyne -> ${e instanceof Error ? e?.message : "Unknown Error"}`);
  }
});

bot.start();

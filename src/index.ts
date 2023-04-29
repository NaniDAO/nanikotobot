import { Bot } from "grammy";
import { config } from "dotenv";
import { getChatCompletion } from "./openai";
import { ChatCompletionRequestMessageWithTimestamp, getRelevantTelegramHistory, storeEmbeddingsWithMetadata } from "./memory";
import { getSystemPrompt } from "./system_prompt";
import { ChatCompletionRequestMessage } from 'openai'
import { summarizeHistoricalContext } from "./summarize";

config()

const bot = new Bot(process.env.TELEGRAM_TOKEN!);

bot.api.getC

bot.on("message", async (ctx) => {
  console.log('Chat Room ->', ctx.msg.chat.id)

  try {
    const message = ctx.message.text
    const author = (await ctx.getAuthor())

    if (!message) {
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
    })

    console.log('Stored ->', message)

    if (message.toLowerCase().includes("nani")) { // to make it more conversational
      const historicalContext: ChatCompletionRequestMessageWithTimestamp[] = await getRelevantTelegramHistory({
        query: message,
        secondsAgo: 60,
      })

      console.log('Generated History ->', history)

      let messageChain: ChatCompletionRequestMessage[] = []
      if (ctx.message.reply_to_message?.text) {
        messageChain.push({
          role: "user",
          content: ctx.message.reply_to_message.text,
          name: ctx.message?.reply_to_message?.from?.username,
        })
      }

      messageChain.push({
        role: "user",
        content: message,
        name: author.user.username,
      })

      const relevantHistoricalContext = historicalContext && historicalContext.length > 0 ? await summarizeHistoricalContext({
        historicalContext,
        query: messageChain.map((message) => message.content).join('\n'),
      }) : ''

      const response = await getChatCompletion({
        messages: [
          ...messageChain,
        ],
        system_prompt: getSystemPrompt(relevantHistoricalContext)
      })

      const reply = await ctx.reply(response, {
        reply_to_message_id: ctx.message.message_id,
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
      })

      console.log('Stored ->', response)
    }
  } catch (e) {
    console.error(e)
    bot.api.sendMessage(ctx.msg.chat.id, `Error @nerderlyne -> ${e instanceof Error ? e?.message : 'Unknown Error'}`)
  }
});

bot.start();

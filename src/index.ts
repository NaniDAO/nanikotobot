import { Bot } from "grammy";
import { config } from "dotenv";
import { getChatCompletion } from "./openai";
import { searchEmbeddings, storeEmbeddingsWithMetadata } from "./memory";
import { getSystemPrompt } from "./system_prompt";
import { ChatCompletionRequestMessage } from 'openai'

config()

const bot = new Bot(process.env.TELEGRAM_TOKEN!);

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.on("message", async (ctx) => {
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
    const results = await searchEmbeddings({
      query: message,
      indexName: "nani-agi",
      namespace: "telegram",
      topK: 5,
    })

    let history: ChatCompletionRequestMessage[] = []
    results.matches?.forEach(async (match) => {
      const content = match?.metadata?.content as string
      const username = match?.metadata?.username as string

      if (content && username) {
        history.push({
          role: "user",
          name: username,
          content: content,
        })
      }
    })

    console.log('Generated History ->', history)

    const response = await getChatCompletion({
      messages: [
        {
          role: "user",
          name: author.user.username,
          content: message,
        }],
      system_prompt: getSystemPrompt()
    })

    const reply = await ctx.reply(response);

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
});

bot.start();

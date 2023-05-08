import { config } from "dotenv";
import { getChatCompletion } from "../llm/openai";
import { TELEGRAM_SYSTEM_PROMPT } from "./prompt";
import { ChatCompletionRequestMessage } from "openai";
import { createMessageToSave, textAdmin } from "@/telegram/utils";
import { Context } from "grammy";
import { interpolateTemplate } from "@/llm/utils";
import { updateHistory, getHistory, getHistoricalContext } from "./history";
import { addToNani } from "@/memory/utils";

config();

export const handleNewMessage = async (
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
    let adminId = process.env.ADMIN_CHAT_ID;
    if (!adminId) {
      throw new Error("ADMIN_CHAT_ID is not configured!");
    }

    // check if the message is from group or admin 
   
    
    if (ctx.chat.id.toString() != groupId.toString() && ctx.chat.id.toString() != adminId.toString()) {
      ctx.reply("♡ JOIN NANI DAO ---> https://t.me/+NKbETPq0J9UyODk9");
      return;
    }

    if (!ctx.message.text) {
      return 
    }

    updateHistory(
      author.user.username ?? '',
      ctx.message.text,
      ctx.message.date
    )

    await addToNani(
      createMessageToSave({
        author: author.user.username ?? '',
        message: ctx.message.text,
      }
      ),
      "telegram"
    )

    let messageChain: ChatCompletionRequestMessage[] = [];
    let msgHistory = await getHistory(5);

    console.log("msgHistory", msgHistory)
   
    msgHistory.forEach((msg) => {
      messageChain.push({
        role: "user",
        content: msg.message,
        name: msg.username,
      });
    });

    console.log("messageChain", messageChain, messageChain[messageChain.length - 1]);

    const relevantHistoricalContext = await getHistoricalContext(
      {
        query: createMessageToSave({
          author: author.user.username ?? '',
          message: ctx.message.text,
        }
        )
      }
    );

    

    const response = await getChatCompletion({
      messages: [...messageChain],
      system_prompt: interpolateTemplate(TELEGRAM_SYSTEM_PROMPT, {
        context: relevantHistoricalContext,
      }),
      model: "gpt-4",
      callback: (message) => {},
    });

    const reply = await ctx.api.sendMessage(ctx.chat.id, response, {
      reply_to_message_id: ctx.message.message_id,
    });

    if (response.length > 0) {
      await addToNani(
        createMessageToSave({
          message: response,
          author: reply.from?.username ?? '',
        }
        ),
        "telegram"
      ) 
    }
    updateHistory(
      reply.from?.username ?? '',
      response,
      reply.date
    )
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


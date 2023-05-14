import { config } from "dotenv";
import { getChatCompletion } from "../llm/openai";
import { NANI_STOP, TELEGRAM_SYSTEM_PROMPT } from "./prompt";
import { ChatCompletionRequestMessage } from "openai";
import { createMessageToSave, textAdmin } from "@/telegram/utils";
import { Context } from "grammy";
import { interpolateTemplate } from "@/llm/utils";
import { updateHistory, getHistory, getHistoricalContext } from "./history";
import { addToNani } from "@/memory/utils";
import { INVALID_GROUP } from "@/constants";
import { getNaniCommandInstructions, getNaniCommands } from "@/commands/utils";

config();

const validateMessage = (ctx: Context) => {
  if (!ctx.message || !ctx.chat) {
    throw new Error("No Message or Chat!");
  }

  const message = ctx.message.text;
  if (!message || message.startsWith('.')) {
    console.log("Nani will not reply to this message.")
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

  if (ctx?.chat?.id.toString() != groupId.toString() && ctx?.chat?.id.toString() != adminId.toString()) {
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
    const date = await ctx?.message?.date as number;
    const author = await ctx.getAuthor();

    updateHistory(author.user.username ?? '', message, date);
    await addToNani(createMessageToSave({ author: author.user.username ?? 'bot', message }), "telegram");

    let messageChain: ChatCompletionRequestMessage[] = [];
    let msgHistory = await getHistory(5);

    msgHistory.forEach((msg) => {
      messageChain.push({ role: "user", content: msg.message, name: msg.username });
    });


    const processChatCompletion = async (messageChain: ChatCompletionRequestMessage[]) => {
      console.log('processChatCompletion called')
      const response = await getChatCompletion({
        messages: [...messageChain],
        system_prompt: interpolateTemplate(TELEGRAM_SYSTEM_PROMPT, { commands: getNaniCommandInstructions() }),
        model: "gpt-4",
        stop: [NANI_STOP, '\n'],
        callback: (message) => {},
      });
      console.log(`response: ${response}`);

      const command = getNaniCommands().find(cmd => response.startsWith(cmd.name));
      console.log(`command: ${command}`);

      if (command) {
        const arg = response.slice(command.name.length).trim();
        const result = await command.action(arg);
        console.info(`command ${command.name} with arg ${arg} produced result ${result}`);

        messageChain.push({ role: "user", content: `${response}\n${result}${NANI_STOP}`, name: '@nanikotobot' });
        await processChatCompletion(messageChain);
      } else {

        let reply = response
        if (reply.startsWith('/reply')) {
          reply = reply.slice('/reply'.length).trim();
        }
        await replyNow(reply, ctx);
          return;
      }
    };

    await processChatCompletion(messageChain);
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


export const replyNow = async (reply: string, ctx: Context) => {
    if (reply.length > 0) {
      const res = await ctx.api.sendMessage(ctx?.chat?.id ?? '', reply, { reply_to_message_id: ctx?.message?.message_id });

      await addToNani(createMessageToSave({ message: reply, author: '@nanikotobot' }), "telegram");

      updateHistory('@nanikotobot', reply, res.date);
    }
}


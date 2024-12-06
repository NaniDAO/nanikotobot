import { config } from "dotenv";
import { getReply } from "@/commands/reply";
import { Client, GatewayIntentBits, Message } from "discord.js";
import { ChatCompletionRequestMessage } from "openai";
import { handleNaniMaker } from "./handleNaniMaker";
import { channels } from "@/constants";
import { getAction, getReaction, summarizeMessages } from "@/llm";

config();

const DISCORD_BOT_ID = process.env.DISCORD_BOT_ID;

if (!DISCORD_BOT_ID) {
  throw new Error("NO DISCORD BOT ID SET");
}

const isProposal = (message: Message) => {
  return message.content.startsWith("!propose");
};

const replaceUserMentionsWithUsernames = (message: Message) => {
  let content = message.content;
  // Replace all user mentions in the message
  message.mentions.users.forEach((user) => {
    const userMention = `<@${user.id}>`;
    const userMentionNick = `<@!${user.id}>`;
    content = content
      .replace(userMention, `@${user.username}`)
      .replace(userMentionNick, `@${user.username}`);
  });
  return content;
};

const validate = (message: Message) => {
  if (message.author.bot) return false;
  if (message.content.startsWith(".")) return false;
  if (message.content === "") return false; // image ?
  if (
    message.content.includes("@here") ||
    message.content.includes("@everyone")
  )
    return false;

  return true;
};

const handleDiscordReply = async (message: Message) => {
  // @TODO update embedding db
  // await addToNani(
  //   createMessageToSave({
  //     author: message.author.username,
  //     message: message.content,
  //   }),
  //   "discord"
  // );

  const action = await getAction({
    platform: "discord",
    message: {
      role: "user",
      content: replaceUserMentionsWithUsernames(message),
    },
  });

  console.log("ACTION", action);

  if (action === "[REPLY]") {
    const messages = await message.channel.messages.fetch({ limit: 4 });
    console.log();
    const messageChain: ChatCompletionRequestMessage[] = [...messages.values()]
      .map((message) => {
        console.log("MESSAGE", message.author.id, DISCORD_BOT_ID);
        return {
          name: message.author.username,
          content: replaceUserMentionsWithUsernames(message),
          role:
            parseInt(message.author.id) == parseInt(DISCORD_BOT_ID)
              ? "assistant"
              : ("user" as ChatCompletionRequestMessage["role"]),
        };
      })
      .reverse();

    const summary = ""; // await summarizeMessages(messageChain);

    console.log("SUMMARY: ", summary);

    const response = await getReply({
      platform: "discord",
      summary,
      messages: [
        {
          role: "user",
          content: message.content.trim(),
        },
      ],
    });

    if (response.length < 2000) {
      await message.channel.send(response);
    } else {
      // Split long messages into chunks of 2000 characters
      const chunks = response.match(/.{1,2000}/g) || [];
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }
    }
  } else if (action === "[REACT]") {
    const reaction = await getReaction({
      platform: "discord",
      message: {
        role: "user",
        content: replaceUserMentionsWithUsernames(message),
      },
    });

    console.log("Reaction:", reaction);
    message.react(reaction);
  } else {
    // [IGNORE]
  }

  // @TODO add embeddings
  // await addToNani(
  //   createMessageToSave({
  //     author: replied.author.username,
  //     message: response,
  //   }),
  //   "discord"
  // );
};

const handleNewProposal = async (message: Message) => {
  const request = message.content.split("!propose")[1].trim();
  console.info("[propose] request ->", request);

  message.channel.send(`Proposal "${request}" created! (NOT IMPLEMENTED)`);
};

const isNaniMaker = (message: Message) => {
  return message.content.trim().startsWith("!imagine");
};

export function initDiscord() {
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
  const client: Client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once("ready", () => {
    console.log("Bot is ready!");
  });

  client.on("messageCreate", async (message: Message) => {
    try {
      if (!client.user) {
        // bot not ready
        return;
      }

      if (!validate(message)) {
        return;
      }

      if (isNaniMaker(message)) {
        console.info("NANI MAKER ->");
        await handleNaniMaker(message);
        return;
      }

      if (
        message.channel.id == channels["proposals"] &&
        isProposal(message) &&
        message.mentions.has(client.user.id)
      ) {
        handleNewProposal(message);
      } else {
        console.log("HANDLE DISCORD REPLY");
        handleDiscordReply(message);
      }
    } catch (e) {
      console.error(e);
    }
  });

  client.login(DISCORD_TOKEN);
}

initDiscord();

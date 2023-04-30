import { Bot } from "grammy";
import { config } from "dotenv";

config();

export const bot = new Bot(process.env.TELEGRAM_TOKEN!);

export const textAdmin = async (message: string) => {
  try {
    await bot.api.sendMessage(
      process.env.ADMIN_CHAT_ID!,
      message
    );
  } catch (e) {
    console.log(e);
  }
}

// TODO: Implement
const getMessageChain = async (message) => {

};

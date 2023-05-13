import { Bot, Context } from "grammy";
import { config } from "dotenv";
import { memoize } from "lodash-es";
import natural from 'natural';

config();

export const createTelegramBot = () => {
    const token = process.env.TELEGRAM_TOKEN;
    
    if (!token) throw Error("TELEGRAM_TOKEN is not configured!");
  
    return new Bot(process.env.TELEGRAM_TOKEN!)
};

export const textAdmin = async (ctx: Context, message: string) => {
  try {
    await ctx.api.sendMessage(process.env.TELEGRAM_CHAT_ID!, message);
  } catch (e) {
    console.log(e);
  }
};


export const extractKeywords = (query: string, numKeywords: number = 5): string[] => {
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(query);

  const keywords = tfidf.listTerms(0)
    .slice(0, numKeywords)
    .map((term) => term.term.toLowerCase());

  return keywords;
};

export const createMessageToSave = ({ 
  author,
  message
}: {
  author: string;
  message: string;
}) => {
  return `@${author} -> ${message}`
}

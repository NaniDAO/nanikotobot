import { getChatCompletion, getNaniCompletion } from "@/llm/openai";
import { interpolateTemplate } from "@/llm/utils";
import { getHistoricalContext } from "@/telegram/history";
import { ChatCompletionRequestMessage } from "openai";
import { SOCIAL_SYSTEM_PROMPT } from "./prompt";
import { countTokens } from "@/utils";
import { getPageSummary } from "../web";
import { addToNani } from "@/memory/utils";

export type PlatformEnum = "telegram" | "discord" | "twitter";

// unified reply function for all social platforms -> discord, telegram, twitter etc.
export const getReply = async ({
  platform,
  messages,
  soup,
}: {
  platform: PlatformEnum;
  messages: ChatCompletionRequestMessage[];
  soup?: string;
}): Promise<string> => {
    if (!soup) {
      soup = await getHistoricalContext({ history: messages });
    }
    
    const system_prompt = interpolateTemplate(SOCIAL_SYSTEM_PROMPT, { platform, context: soup });
    const tokenCount = countTokens(soup, "main") + messages.map((message) => countTokens(message.content, "main")).reduce((a, b) => a + b, 0) + countTokens(system_prompt, "main");
    const max_tokens = 2000 - tokenCount;
    console.log(`token_count: ${tokenCount} max tokens: ${max_tokens}`)

    if (max_tokens < 0) {
        messages.shift();
        return getReply({ platform, messages });
    }
    
    const response = await getChatCompletion({
        messages,
        system_prompt,
        model: "gpt-3.5-turbo",
        max_tokens,
    });

    console.log('response', response)
    
    // nuking ross-bot for now, will finetune with more conversational data later
    // const rephrased = await getNaniCompletion({
    //     content: response,
    // });

    return response;
}


// This function checks for a URL in the text, fetches a page summary and saves it to Nani
export const handlePageSummary = async (msg: string) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const matches = msg.match(urlPattern);

  if (matches && matches.length > 0) {
      const url = matches[0];
      const pageSummary = await getPageSummary(500, url);
      console.info(`[web] ${url}: ${pageSummary.summary}`)
      // save individual chunks + the summary 
      for (const chunk of pageSummary.chunks) {
          await addToNani(
              chunk,
              url
          );
      }

      await addToNani(
          pageSummary.summary,
          url
      );

      return pageSummary.summary;
  }
  return null;
}
import { getChatCompletion } from "@/llm";
import { ChatCompletionRequestMessage } from "openai";
import { getSocialSystemPrompt } from "./prompt";

export type PlatformEnum = "telegram" | "discord" | "twitter";

// unified reply function for all social platforms -> discord, telegram, twitter etc.
export const getReply = async ({
  platform,
  summary,
  messages,
}: {
  platform: PlatformEnum;
  summary: string;
  messages: ChatCompletionRequestMessage[];
}): Promise<string> => {
  // const soup = await getHistoricalContext({ history: messages });
  const system_prompt = getSocialSystemPrompt(platform, summary);

  const maxTokens = {
    telegram: 560,
    discord: 560,
    twitter: 280,
  }[platform];

  const response = await getChatCompletion({
    messages,
    system_prompt,
    model: process.env.MODEL_ID,
    max_tokens: maxTokens,
  });

  return response;
};

import { getChatCompletion } from "@/llm/openai";
import { interpolateTemplate } from "@/llm/utils";
import { getHistoricalContext } from "@/telegram/history";
import { ChatCompletionRequestMessage } from "openai";
import { SOCIAL_SYSTEM_PROMPT } from "./prompt";

export type PlatformEnum = 'telegram' | 'discord' | 'twitter'; 

// unified reply function for all social platforms -> discord, telegram, twitter etc.
export const getReply = async ({
    platform,
    messages,
}: {
    platform: PlatformEnum;
    messages: ChatCompletionRequestMessage[];
}) => {
    console.info('platform', platform)
    const soup = await getHistoricalContext({ history: messages });
    console.info('context', soup);
    const response = await getChatCompletion({
        messages,
        system_prompt: interpolateTemplate(SOCIAL_SYSTEM_PROMPT, { platform, context: soup }),
        model: "gpt-4",
    });
    console.info('response', response);
    return response;
}
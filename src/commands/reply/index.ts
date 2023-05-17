import { getChatCompletion, getNaniCompletion } from "@/llm/openai";
import { interpolateTemplate } from "@/llm/utils";
import { getHistoricalContext } from "@/telegram/history";
import { ChatCompletionRequestMessage } from "openai";
import { SOCIAL_SYSTEM_PROMPT } from "./prompt";
import { countTokens } from "@/utils";

export type PlatformEnum = "telegram" | "discord" | "twitter";

// unified reply function for all social platforms -> discord, telegram, twitter etc.
export const getReply = async ({
  platform,
  messages,
}: {
  platform: PlatformEnum;
  messages: ChatCompletionRequestMessage[];
}): Promise<string> => {
    const soup = await getHistoricalContext({ history: messages });
    
    const system_prompt = interpolateTemplate(SOCIAL_SYSTEM_PROMPT, { platform, context: soup });
    const tokenCount = countTokens(soup, "main") + messages.map((message) => countTokens(message.content, "main")).reduce((a, b) => a + b, 0) + countTokens(system_prompt, "main");
    const max_tokens = 2000 - tokenCount;
    console.log(`token_count: ${tokenCount} max tokens: ${max_tokens}`)

    // if the max_tokens is less than 0
    // pop the first message and try again
    if (max_tokens < 0) {
        messages.shift();
        return getReply({ platform, messages });
    }
    
    console.info('SYSTEM PROMPT - SOCIAL', system_prompt)
    const response = await getChatCompletion({
        messages,
        system_prompt,
        model: "gpt-4",
        max_tokens,
    });

    console.log('response', response)
    
    // nuking ross-bot for now, will finetune with more conversational data later
    // const rephrased = await getNaniCompletion({
    //     content: response,
    // });

    return response;
}

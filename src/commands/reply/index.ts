import { getChatCompletion, getNaniCompletion } from "@/llm/openai";
import { interpolateTemplate } from "@/llm/utils";
import { getHistoricalContext } from "@/telegram/history";
import { ChatCompletionRequestMessage } from "openai";
import { SOCIAL_SYSTEM_PROMPT } from "./prompt";
import { countTokens } from "@/utils";

export type PlatformEnum = 'telegram' | 'discord' | 'twitter'; 

// unified reply function for all social platforms -> discord, telegram, twitter etc.
export const getReply = async ({
    platform,
    messages,
}: {
    platform: PlatformEnum;
    messages: ChatCompletionRequestMessage[];
}) => {
    const soup = await getHistoricalContext({ history: messages });
    
    const system_prompt = interpolateTemplate(SOCIAL_SYSTEM_PROMPT, { platform, context: soup });
    const tokenCount = countTokens(soup) + messages.map((message) => countTokens(message.content)).reduce((a, b) => a + b, 0) + countTokens(system_prompt);
    const max_tokens = 2000 - tokenCount;
    console.log(`token_count: ${tokenCount} max tokens: ${max_tokens}`)

    // if the max_tokens is less than 0
    // pop the last message and try again
    if (max_tokens < 0) {
        messages.pop();
        return await getReply({ platform, messages });
    }
    
    const response = await getChatCompletion({
        messages,
        system_prompt,
        model: "gpt-4",
       
    });
    console.log(response)
    // adding a rephrasing step to make the response more human(ross)-like
    const rephrased = await getNaniCompletion({
        content: response,
       
    });

    return rephrased;
}
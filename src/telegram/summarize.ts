import { getChatCompletion } from "@/llm/openai";
import { interpolateTemplate } from "@/llm/utils";
import { SUMMARIZE_CONVERSATION, SUMMARIZE_WITH_QUERY } from "./prompt";

export const createOverlappingChunks = (text: string, chunkSize: number, overlap: number) => {
  const chunks = [];
  let index = 0;

  while (index < text.length) {
      const chunk = text.slice(index, index + chunkSize);
      chunks.push(chunk);
      index += chunkSize - overlap;
  }

  return chunks;
};

export const summarizeHistoricalContext = async ({
  historicalContext,
  query,
}: {
  historicalContext: string;
  query?: string;
}) => {
 

  const prompt = query ? interpolateTemplate(SUMMARIZE_WITH_QUERY, { historicalContext, query }) : interpolateTemplate(SUMMARIZE_CONVERSATION, { conversation: historicalContext });

  const summary = await getChatCompletion({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    system_prompt: '',
    model: "gpt-3.5-turbo",
    max_tokens: 100,
    callback: (message) => {
    }
  });


  return summary;
};

// FIXME: types
export const shouldReplyToMessage = async (messages: any[]) => {
  try {
    let shouldReply = false;
    const analysis = await getChatCompletion({
      messages: [],
      system_prompt: `Your job is look at the following conversation and make a decision whether or not it would be natural for "Nani" to reply.
      Nani is helpful and friendly, she is interested in Crypto/Blockchain and AI.

      Conversation:
      ${messages
        .map((message) => {
          return `${message?.name ?? message.role}: ${message.content}`;
        })
        .join("\n")}

      Remember, only reply with "yes" or "no"`,
      model: "gpt-3.5-turbo",
      callback: (message) => {},
    });

    if (analysis.includes("yes")) {
      shouldReply = true;
    }

    return shouldReply;
  } catch (e) {
    console.error(e);
    throw new Error("Error deciding whether or not to reply to message");
  }
};

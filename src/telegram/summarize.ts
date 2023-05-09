import { getChatCompletion } from "@/llm/openai";

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
  query: string;
}) => {
 

  const prompt = `The following text contains information related to the question: "${query}". Your task is to read the text, extract the relevant information, and provide a concise and accurate summary that directly answers the question. Ignore any unrelated content. The summary should be no more than 300 words.

  Text to Analyze:
  \`\`\`
  ${historicalContext}
  \`\`\`

  Please provide a summary that answers the question:`;

  const summary = await getChatCompletion({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    system_prompt: '',
    model: "gpt-3.5-turbo",
    max_tokens: 500,
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

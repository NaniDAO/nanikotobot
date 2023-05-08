import { getChatCompletion } from "@/llm/openai";
import { ChatCompletionRequestMessageWithTimestamp } from "@/memory";
import { unixTimestampToISO } from "@/utils";

export const summarizeHistoricalContext = async ({
  historicalContext,
  query,
}: {
  historicalContext: ChatCompletionRequestMessageWithTimestamp[];
  query: string;
}) => {
  console.log("summarizeHistoricalContext called with:", {
    historicalContext,
    query,
  });

  const messages = historicalContext.map((message) => {
    return `${message.content}`;
  }).join('\n\n');
  console.log("messages:", messages)

  const prompt = `The following text contains information related to the question: "${query}". Your task is to read the text, extract the relevant information, and provide a concise and accurate summary that directly answers the question. Ignore any unrelated content. The summary should be no more than 300 words.

  Text to Analyze:
  \`\`\`
  ${messages}
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
      console.log('.')
      console.log(message)
    }
  });
  

  console.log("summary:", summary, summary.length)


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

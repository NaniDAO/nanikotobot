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
  let text = "";
  const summary = getChatCompletion({
    messages: [],
    system_prompt: `Summarize the following conversation to answer the question in a concise and accurate way: "${query}"

    Conversation:
    ${historicalContext
      .map((message) => {
        return `${message?.name ?? message.role}: ${
          message.content
        } (${unixTimestampToISO(message?.timestamp)})`;
      })
      .join("\n")}
    `,
    model: "gpt-3.5-turbo",
    callback: (message) => {
      console.clear();
      text += message;
      console.log(text);
    },
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

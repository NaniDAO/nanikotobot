import { getChatCompletion } from "./openai";
import { ChatCompletionRequestMessageWithTimestamp } from './memory'
import { unixTimestampToISO } from "./utils";

export const summarizeHistoricalContext = async ({
  historicalContext,
  query,
}: {
  historicalContext: ChatCompletionRequestMessageWithTimestamp[],
  query: string,
}) => {
  const summary = getChatCompletion({
    messages: [],
    system_prompt: `Summarize the following conversation to answer the question in a concise and accurate way: "${query}"

    Conversation:
    ${historicalContext.map((message) => {
      return `${message?.name ?? message.role}: ${message.content} (${unixTimestampToISO(message?.timestamp)})`
    }).join('\n')}
    `,
    model: "gpt-3.5-turbo"
  })

  return summary
}

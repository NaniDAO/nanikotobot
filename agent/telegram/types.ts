import { ChatCompletionRequestMessage } from "openai";

export type ChatCompletionRequestMessageWithTimestamp =
  ChatCompletionRequestMessage & {
    timestamp: number;
  };

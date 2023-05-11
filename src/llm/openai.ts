import { config } from "dotenv";
import { memoize } from "lodash-es";
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from "openai";
import { AxiosError } from "axios";

config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

export const contextWindowSize = {
  'gpt-3.5-turbo': 4000,
  'gpt-4': 4000,
};

export const createLlmClient = memoize(() => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set")

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return new OpenAIApi(configuration);
})

const parseChunk = (chunk: Buffer): string[] =>
  chunk
    .toString("utf8")
    .split("\n")
    .filter((line: string) => line.trim().startsWith("data: "));

const extractMessage = (line: string): string => line.replace(/^data: /, "");

const processLines = (
  lines: string[],
  callback: (message: string) => void
): boolean => {
  for (const line of lines) {
    const message = extractMessage(line);
    if (message === "[DONE]") {
      return true;
    }

    const json = JSON.parse(message);
    const token = json.choices[0].delta.content;
    if (token) {
      callback(token);
    }
  }
  return false;
};

export const getChatCompletion = async ({
  messages,
  system_prompt,
  model = "gpt-4",
  max_tokens,
  callback,
}: {
  messages: ChatCompletionRequestMessage[];
  system_prompt: string;
  model?: string;
  callback: (message: string) => void;
  max_tokens?: number;
}): Promise<string> => {
  try {
    let reply = "";
    const internalCallback = (message: string) => {
      reply += message;
      console.clear()
      console.log(reply)
      callback(message);
    };

    const response = await openai.createChatCompletion(
      {
        model: model,
        messages: [
          {
            role: "system",
            content: system_prompt,
          },
          ...messages,
        ],
        stream: true,
        stop: ["/STOP/", '###'],
        max_tokens,
        temperature: 1,
      },
      {
        responseType: "stream",
      }
    );

    for await (const chunk of response.data as unknown as AsyncIterable<Buffer>) {
      const lines = parseChunk(chunk);
      if (processLines(lines, internalCallback)) {
        break;
      }
    }

    return reply;
  } catch (e) {
    const { response } = e as AxiosError;
    switch (response?.status) {
      case 400:
        throw Error(`Context window is full.`);
      case 404:
        throw Error(`Model '${model}' is unavailable.`);
      case 429:
        throw Error(`OpenAI rate limited.`);
      
      default:
        throw e;
    }
  }
};



import { config } from "dotenv";
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from "openai";

config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

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
  callback,
}: {
  messages: ChatCompletionRequestMessage[];
  system_prompt: string;
  model?: string;
  callback: (message: string) => void;
}): Promise<string> => {
  try {
    let reply = "";
    const internalCallback = (message: string) => {
      console.clear();
      console.log(message);
      reply += message;
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
        stop: "/STOP/",
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
    if (e?.isAxiosError) {
      throw new Error(e);
    } else {
      throw new Error("Unknown Error");
    }
  }
};

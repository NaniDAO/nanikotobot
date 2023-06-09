import { config } from "dotenv";
import { memoize } from "lodash-es";
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from "openai";
import { AxiosError } from "axios";
import { countTokens } from "@/utils";

config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

export const contextWindowSize = {
  "gpt-3.5-turbo": 4000,
  "gpt-4": 4000,
};

export const createLlmClient = memoize(() => {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const HELICONE_KEY = process.env.HELICONE_KEY;
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY is not set");

  let configuration: Configuration;

  if (HELICONE_KEY) {
    configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: "https://oai.hconeai.com/v1",
      baseOptions: {
        headers: {
          "Helicone-Auth": `Bearer ${HELICONE_KEY}`, 
        },
      }
    });
  } else {
    configuration = new Configuration({
      apiKey: OPENAI_KEY,
    });
  }

  return new OpenAIApi(configuration);
});

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
  callback?: (message: string) => void;
  max_tokens?: number;
}): Promise<string> => {
  try {
    let reply = "";
    const internalCallback = (message: string) => {
      reply += message;
      console.clear();
      console.log(reply);
      callback?.(message);
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
        stop: ["/STOP/", "###"],
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

export const getNaniCompletion = async ({
  content,
}: {
  content: string;
}) => {
  const finetunedModel = process.env.FINETUNED_MODEL
  if (!finetunedModel) throw new Error("FINETUNED_MODEL is not set")
  const llm = createLlmClient();

  // check tokens length
  const tokenCount = countTokens(content, 'finetune') + countTokens("Statement: \nRestatement:###", 'finetune')
  const max_tokens = 2000 - tokenCount
  if (max_tokens < 0) return undefined
  
  const response = await llm.createCompletion({
    model: finetunedModel,
    prompt: `Statement: ${content}\nRestatement:###`,
    temperature: 0,
    max_tokens: max_tokens,
    top_p: 0.23,
    best_of: 1,
    frequency_penalty: 1.36,
    presence_penalty: 1,
    stop: ["###"],
  })

  const reply = response?.data?.choices?.[0]?.text?.replace(/@\w+/g, '').replace('Restatement:', '').replace('###', '').trim()

  return reply
}



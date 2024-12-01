import { config } from "dotenv";
import { ChatCompletionRequestMessage } from "openai";
import { AxiosError } from "axios";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { PlatformEnum } from "@/commands/reply";
import {
  getDiscordActionPrompt,
  getDiscordReactionPrompt,
  getTwitterActionPrompt,
  getTwitterGenerationPrompt,
} from "./prompt";
import {
  TwitterActionContext,
  discordActionEnum,
  discordReactionEnum,
  twitterActionEnum,
} from "./types";

config();
if (!process.env.LLM_API_URL)
  throw new Error("LLM_API_URL environment variable is not defined");
if (!process.env.LLM_API_KEY)
  throw new Error("LLM_API_KEY environment variable is not defined");
if (!process.env.OPENROUTER_API_KEY)
  throw new Error("OPENROUTER_API_KEY environment variable is not defined");

export const nani = createOpenAI({
  baseURL: process.env.LLM_API_URL,
  apiKey: process.env.LLM_API_KEY,
});

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const summarizeMessages = async (
  messages: ChatCompletionRequestMessage[]
) => {
  try {
    const response = await generateText({
      model: openrouter("openai/o1-mini"),
      prompt: `MAKE A SMALL SUMMARY OF THE CONVERSATION SO FAR. RETURN THE SUMMARY AND NOTHING ELSE.

      NANI IS AI AGENT THIS SUMMARY WILL BE SENT TO.

      CONVERSATION:
      ${messages
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n")}`,
      maxTokens: 1000,
      maxRetries: 3,
    });

    console.log("RESPONSE", response);

    if (!response.text) {
      throw new Error("Unable to create a summary");
    }

    return response.text;
  } catch (e) {
    const { response } = e as AxiosError;
    switch (response?.status) {
      case 400:
        throw Error(`Context window is full.`);
      case 404:
        throw Error(`Model 'openai/o1-mini' is unavailable.`);
      case 429:
        throw Error(`Rate limited.`);
      default:
        throw e;
    }
  }
};

export const getAction = async ({
  message,
  platform,
  context,
}: {
  message: ChatCompletionRequestMessage;
  platform: PlatformEnum;
  context?: TwitterActionContext;
}) => {
  if (platform === "discord") {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const result = await generateText({
        model: openrouter("openai/gpt-4o-mini"),
        prompt: getDiscordActionPrompt(message),
        maxTokens: 100,
        temperature: 0.8,
      });

      const parsed = discordActionEnum.safeParse(result.text);
      if (parsed.success) {
        return parsed.data;
      }

      attempts++;
      if (attempts === maxAttempts) {
        throw new Error("Failed to get valid action after 3 attempts");
      }
    }
  } else if (platform === "twitter") {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const result = await generateText({
        model: openrouter("openai/gpt-4o-mini"),
        prompt: getTwitterActionPrompt(message, context!),
        maxTokens: 100,
        temperature: 0.6,
      });

      const parsed = twitterActionEnum.safeParse(result.text);
      if (parsed.success) {
        return parsed.data;
      }

      attempts++;
      if (attempts === maxAttempts) {
        console.error(
          "Failed to get valid action after 3 attempts",
          result.text
        );
        return "[IGNORE]";
      }
    }
  }
  {
    throw new Error("Actions unsupported for " + platform);
  }
};

export const getReaction = async ({
  message,
  platform,
}: {
  message: ChatCompletionRequestMessage;
  platform: PlatformEnum;
}) => {
  if (platform === "discord") {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const result = await generateText({
        model: nani(process.env.MODEL_ID!),
        prompt: getDiscordReactionPrompt(message),
        maxTokens: 100,
        temperature: 0.6,
      });

      const parsed = discordReactionEnum.safeParse(result.text);
      if (parsed.success) {
        return parsed.data;
      }

      attempts++;
      if (attempts === maxAttempts) {
        throw new Error("Failed to get valid action after 3 attempts");
      }
    }
  } else if (platform === "twitter") {
  }
  throw new Error("Unsupported platform");
};

const getRandomContext = () => {
  const contexts = [
    "incentives",
    "crypto twitter CT",
    "3am feelz",
    "web3 philosophy",
    "defi markets",
    "NFT alpha",
    "dao governance",
    "gaming guilds",
    "smart contracts",
    "layer2 scaling",
    "token economics",
    "blockchain tech",
    "crypto news",
    "market analysis",
    "trading strategy",
    "nft collections",
    "metaverse",
    "web3 gaming",
    "defi yield",
    "liquidity mining",
    "staking rewards",
    "protocol updates",
    "ethereum news",
    "bitcoin trends",
    "alt season",
    "memecoin mania",
    "whale watching",
    "gas fees",
    "blockchain adoption",
    "institutional crypto",
    "defi protocols",
    "yield farming",
    "nft marketplaces",
    "crypto regulation",
    "mining updates",
    "technical analysis",
    "chain metrics",
    "network stats",
    "dev updates",
    "governance votes",
    "token launches",
    "airdrop season",
    "rugpull warnings",
    "community calls",
    "AMA sessions",
    "hackathon news",
    "gm vibes",
    "degen hours",
    "alpha leaks",
    "wen token",
    "copium levels",
    "hopium dose",
    "fud control",
    "diamond hands",
    "ape psychology",
    "moon mission",
    "bear market",
    "bull run",
    "crypto wisdom",
    "blockchain future",
    "web3 dreams",
    "protocol wars",
    "bridge drama",
    "chain dynamics",
    "validator news",
    "consensus chat",
    "scaling debates",
    "privacy talks",
    "zkp innovation",
    "rollup tech",
    "cross-chain",
    "interop goals",
    "wallet security",
    "seed phrases",
    "key management",
    "cold storage",
    "hot wallet",
    "dex updates",
    "amm mechanics",
    "pool stats",
    "impermanent loss",
    "yield optimizing",
    "farming strategy",
    "leverage plays",
    "options trading",
    "perps market",
    "futures talk",
    "margin calls",
    "liquidation watch",
    "risk management",
    "portfolio balance",
    "asset allocation",
    "diversification",
    "correlation study",
    "market cycles",
    "trend analysis",
    "momentum signals",
    "volume profiles",
    "support levels",
    "resistance zones",
    "breakout patterns",
    "chart reading",
    "indicator check",
    "oscillator stats",
    "fibonacci lines",
    "elliot waves",
    "wyckoff method",
    "market sentiment",
    "fear index",
  ];

  return contexts[Math.floor(Math.random() * contexts.length)];
};

export const generateTweet = async () => {
  try {
    const context = getRandomContext();

    const response = await generateText({
      model: nani(process.env.MODEL_ID!),
      prompt: getTwitterGenerationPrompt(context),
      temperature: 0.6,
      maxTokens: 280,
    });

    if (!response.text) {
      throw new Error("No tweet text generated");
    }

    return response.text;
  } catch (e) {
    const { response } = e as AxiosError;
    switch (response?.status) {
      case 400:
        throw Error(`Context window is full.`);
      case 404:
        throw Error(`Model is unavailable.`);
      case 429:
        throw Error(`Rate limited.`);
      default:
        throw e;
    }
  }
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
    const response = await generateText({
      model: nani(process.env.MODEL_ID!),
      system: system_prompt,
      messages,
      maxTokens: max_tokens,
      maxRetries: 3,
      temperature: 0.7,
    });

    return response.text;
  } catch (e) {
    const { response } = e as AxiosError;
    switch (response?.status) {
      case 400:
        throw Error(`Context window is full.`);
      case 404:
        throw Error(`Model '${model}' is unavailable.`);
      case 429:
        throw Error(`Rate limited.`);
      default:
        throw e;
    }
  }
};

export const getTweetScore = async (tweet: string): Promise<number> => {
  try {
    const response = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      prompt: `Rate this tweet on a scale of 0-100 based on the following criteria:
- How engaging and "banger" worthy it is (viral potential, clever writing, memorable)
- It should NOT promote or mention any tokens/tickers except NANI or ⌘
- It should be authentic and not overly promotional
- It should fit crypto twitter culture and vibes

If it mentions unauthorized tokens/tickers, rate it 0.
If it's promotional/shilly, rate it under 40.
If it's engaging but basic, rate it 40-70.
If it's a potential banger, rate it 70-100.

ONLY RETURN A NUMBER 0-100, NOTHING ELSE.

Tweet to rate: "${tweet}"`,
      maxTokens: 10,
      temperature: 0.3,
    });

    const score = parseInt(response.text);
    if (isNaN(score) || score < 0 || score > 100) {
      throw new Error("Invalid score generated");
    }

    return score;
  } catch (e) {
    const { response } = e as AxiosError;
    switch (response?.status) {
      case 400:
        throw Error(`Context window is full.`);
      case 404:
        throw Error(`Model is unavailable.`);
      case 429:
        throw Error(`Rate limited.`);
      default:
        throw e;
    }
  }
};

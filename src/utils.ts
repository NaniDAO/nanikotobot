import { v4 as uuid } from "uuid";
import { encode } from "gpt-3-encoder";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getVectorId = () => {
  return uuid().toString();
};

// returns UNIX timestamp `seconds` seconds ago
export const getTimestampAt = (seconds: number) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timestampSecondsAgo = currentTimestamp - seconds;
  return timestampSecondsAgo;
};

export const unixTimestampToISO = (timestamp: number) => {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp * 1000).toISOString();
};

export const AVG_CHARACTERS_PER_TOKEN = 4;

export const countTokens = (text: string, type: "main" | "finetune") => {
  if (type === "main") {
    const encoding = get_encoding("cl100k_base");
    return encoding.encode(text).length;
  } else {
    const encoding = get_encoding("p50k_base");
    return encoding.encode(text).length;
  }
};

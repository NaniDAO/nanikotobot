import { Scraper } from "agent-twitter-client";
import fs from "fs";
import path from "path";
import { ApiResponseError, TwitterApi } from "twitter-api-v2";

import { init } from "./actions";
import { generateTweet, getAction, getTweetScore } from "@/llm";
import { getReply } from "@/commands/reply";
import { TwitterApiRateLimitPlugin } from "@twitter-api-v2/plugin-rate-limit";
import { sleep } from "@/utils";

type TimelineTweet = {
  bookmark_count: number;
  bookmarked: boolean;
  created_at: string;
  conversation_id_str: string;
  display_text_range: number[];
  entities: {
    hashtags: any[];
    symbols: any[];
    timestamps: any[];
    urls: any[];
    user_mentions: any[];
  };
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  is_quote_status: boolean;
  lang: string;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  user_id_str: string;
  id_str: string;
  username?: string;
};

export const createXAgentClient = async ({
  username,
  password,
  email,
  token,
}: {
  username: string;
  email: string;
  password: string;
  token: string;
}) => {
  const client = new Scraper({});
  let userId: string = "1859553818775781376";

  const rateLimitPlugin = new TwitterApiRateLimitPlugin();
  const api = new TwitterApi(
    {
      appKey: process.env.X_API_KEY!,
      appSecret: process.env.X_API_KEY_SECRET!,
      accessToken: process.env.X_ACCESS_TOKEN!,
      accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
    },
    { plugins: [rateLimitPlugin] }
  );

  console.log("USER ID", userId);

  const seenTweetsFile = path.join(process.cwd(), "seen_tweets.json");

  let seenTweetIds: Set<string>;
  try {
    const savedTweets = JSON.parse(fs.readFileSync(seenTweetsFile, "utf8"));
    seenTweetIds = new Set(savedTweets);
  } catch {
    seenTweetIds = new Set<string>();
    fs.writeFileSync(seenTweetsFile, JSON.stringify(Array.from(seenTweetIds)));
  }

  await init(client, { username, password, email });

  const addAndSaveSeenTweetId = (tweetId: string) => {
    console.log("[SAVING TWEET]", tweetId);
    if (tweetId === null || tweetId === undefined) {
      return;
    }

    seenTweetIds.add(tweetId);
    fs.writeFileSync(seenTweetsFile, JSON.stringify(Array.from(seenTweetIds)));
  };

  return {
    init: async () => await init(client, { username, password }),
    scraper: client,
    getTimeline: async () => {
      try {
        return await client.fetchHomeTimeline(100, Array.from(seenTweetIds));
      } catch (error) {
        if (error?.response?.status === 431) {
          console.log(`[431 ERROR]`);
          // Delete seen_tweets.json
          try {
            fs.unlinkSync(seenTweetsFile);
            seenTweetIds.clear();
          } catch (e) {
            console.log("Error deleting seen_tweets.json:", e);
          }
        } else {
          throw error;
        }
      }
      throw new Error("Failed to fetch timeline after max retries");
    },
    getMentions: async () => await api.v1.mentionTimeline(),
    getTweet: client.getTweet.bind(client),
    getProfile: client.getProfile.bind(client),
    sendTweet: client.sendTweet.bind(client),
    generateTweet: generateTweet.bind(client),
    addSeenTweetId: addAndSaveSeenTweetId,
    getScore: getTweetScore.bind(client),
    like: async (tweetId: string) =>
      api && userId ? await client.likeTweet(tweetId) : null,
    retweet: async (tweetId: string) =>
      api && userId ? await client.retweet(tweetId) : null,
    handleTweet: async (tweet: TimelineTweet) => {
      if (!tweet || tweet?.lang !== "en" || !tweet.full_text || !tweet.id_str) {
        addAndSaveSeenTweetId(tweet?.id_str);
        return;
      }

      console.log(`
            📱 Tweet
            ${tweet.full_text}
            ❤️ ${tweet.favorite_count} 🔄 ${tweet.retweet_count} 💬 ${tweet.reply_count}
          `);

      const action = await getAction({
        message: {
          name: tweet?.username ?? tweet?.name,
          role: "user",
          content: tweet.full_text,
        },
        platform: "twitter",
        context: {
          likes: tweet.favorite_count ?? 0,
          replies: tweet.reply_count ?? 0,
          retweets: tweet.retweet_count ?? 0,
        },
      });

      console.log("[ACTION]", action);

      try {
        switch (action) {
          case "[LIKE]":
            if (api && userId) {
              await autoRetryOnRateLimitError(async () => {
                const response = await client.likeTweet(tweet.id_str);
                return response;
              });
            } else {
              console.log("[SKIPPED LIKE] API not initialized");
            }
            break;

          case "[RETWEET]":
            if (api && userId) {
              await autoRetryOnRateLimitError(async () => {
                const response = await client.retweet(tweet.id_str);
                return response;
              });
            } else {
              console.log("[SKIPPED RETWEET] API not initialized");
            }
            break;

          case "[FOLLOW]":
            if (api && userId) {
              await autoRetryOnRateLimitError(async () => {
                const response = await client.followUser(
                  tweet?.username ?? tweet.user_id_str
                );

                return response;
              });
            } else {
              console.log("[SKIPPED FOLLOW] API not initialized");
            }
            break;

          case "[QUOTE]": {
            let score = 0;
            let quote = "";
            let attempts = 0;

            while (score < 75 && attempts < 3) {
              quote = await getReply({
                messages: [
                  {
                    name: tweet?.username ?? "",
                    role: "user",
                    content: tweet.full_text,
                  },
                ],
                summary: `Nani is quote tweeting a tweet that has likes: ${
                  tweet.favorite_count ?? 0
                }, replies: ${tweet.reply_count ?? 0}, retweets: ${
                  tweet.retweet_count ?? 0
                }`,
                platform: "twitter",
              });

              console.log(`[TWITTER] Quote attempt: ${quote}`);

              score = await getTweetScore(quote);
              console.log(`[TWITTER] Quote scored ${score}`);
              attempts++;

              if (score >= 75) {
                console.log(`[TWITTER] Using quote with ${score} score`);
                break;
              }
            }

            if (score < 75) {
              console.log(
                "[TWITTER] Failed to generate high scoring quote after 3 attempts, skipping"
              );
              return;
            }

            if (api && userId) {
              await autoRetryOnRateLimitError(async () => {
                const response = await client.sendQuoteTweet(
                  quote,
                  tweet.id_str
                );
                return response;
              });
            } else {
              console.log("[SKIPPED QUOTE] API not initialized");
            }
            break;
          }

          case "[BLOCK]": {
            if (api && userId) {
              await autoRetryOnRateLimitError(async () => {
                const response = await api!.v1.reportUserAsSpam({
                  user_id: tweet.id_str,
                  perform_block: true,
                });
                const rateLimit = await rateLimitPlugin.v1.getRateLimit(
                  "tweets"
                );
                console.log(
                  `Block rate limit: ${rateLimit?.remaining}/${rateLimit?.limit}`
                );
                return response;
              });
            } else {
              console.log("[SKIPPED BLOCK] API not initialized");
            }
            break;
          }

          case "[REPLY]": {
            let score = 0;
            let replyText = "";
            let attempts = 0;

            while (score < 75 && attempts < 3) {
              replyText = await getReply({
                messages: [
                  {
                    name: tweet?.username ?? "",
                    role: "user",
                    content: tweet.full_text,
                  },
                ],
                summary: `likes: ${tweet.favorite_count ?? 0}, replies: ${
                  tweet.reply_count ?? 0
                }, retweets: ${tweet.retweet_count ?? 0}`,
                platform: "twitter",
              });

              console.log(`[TWITTER] Reply attempt: ${replyText}`);

              score = await getTweetScore(replyText);
              console.log(`[TWITTER] Reply scored ${score}`);
              attempts++;

              if (score >= 75) {
                console.log(`[TWITTER] Using reply with ${score} score`);
                break;
              }
            }

            if (score < 75) {
              console.log(
                "[TWITTER] Failed to generate high scoring reply after 3 attempts, skipping"
              );
              break;
            }

            await client.sendTweet(replyText, tweet.id_str);
            break;
          }
        }
      } catch (error) {
        if (error instanceof ApiResponseError) {
          console.error("API Error:", error.message, error.code);
          if (error.rateLimitError) {
            console.log("Rate limit details:", error.rateLimit);
          }
        } else {
          console.error("Unknown error:", error);
        }
      }
    },
  };
};

async function autoRetryOnRateLimitError<T>(callback: () => T | Promise<T>) {
  while (true) {
    try {
      return await callback();
    } catch (error) {
      if (
        error instanceof ApiResponseError &&
        error.rateLimitError &&
        error.rateLimit
      ) {
        const resetTimeout = error.rateLimit.reset * 1000;
        const timeToWait = resetTimeout - Date.now() + 1000; // Add 1 second padding

        console.log(`Rate limited. Waiting ${timeToWait}ms before retry`);
        await sleep(timeToWait);
        continue;
      }
      throw error;
    }
  }
}

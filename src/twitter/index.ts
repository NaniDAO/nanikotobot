import { createXAgentClient } from "./client";
import readline from "readline";
import { sleep } from "@/utils";

if (
  !process.env.TWITTER_USERNAME ||
  !process.env.TWITTER_PASSWORD ||
  !process.env.TWITTER_EMAIL ||
  !process.env.X_BEARER_TOKEN
) {
  throw new Error("Missing required Twitter credentials");
}

const USERNAME = process.env.TWITTER_USERNAME;
const PASSWORD = process.env.TWITTER_PASSWORD;
const EMAIL = process.env.TWITTER_EMAIL;
const BEARER_TOKEN = process.env.X_BEARER_TOKEN;

const xPipeline = async () => {
  const client = await createXAgentClient({
    username: USERNAME,
    password: PASSWORD,
    email: EMAIL,
    token: BEARER_TOKEN,
  });

  while (true) {
    try {
      // @TODO handle mentions
      const timeline = await client.getTimeline();

      console.log("[TIMELINE RECIEVED]", timeline.length);

      for (const tweet of timeline) {
        try {
          await client.handleTweet(tweet.legacy);
          client.addSeenTweetId(tweet.legacy.id_str);
          await sleep(3000);
        } catch (error) {
          console.error("[TWEET HANDLING ERROR]", error);
          continue;
        }
      }

      let score = 0;
      let tweet = "";
      while (score < 75) {
        tweet = await client.generateTweet();
        console.log("[TWITTER] Generated tweet", tweet);
        score = await client.getScore(tweet);
        console.log(`[TWITTER] Tweet scored ${score}`);
        if (score >= 75) {
          console.log(`[TWITTER] Sending tweet with ${score} score`);
          await client.sendTweet(tweet);
          break;
        }
      }

      // Wait for 30 minutes before next iteration
      await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000));
    } catch (error) {
      console.error("[PIPELINE ERROR]", error);
      // Wait before retrying the loop
      await sleep(30000);
    }
  }
};

xPipeline().catch((e) => console.error(e));

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
      // const mentions = await client.getMentions();

      // console.log("[MENTIONS RECIEVED]", mentions);

      // for (const mention of mentions) {
      //   try {
      //     await client.handleTweet(mention);
      //     client.addSeenTweetId(mention.id_str);
      //     await sleep(3000);
      //   } catch (error) {
      //     console.error("[MENTION HANDLING ERROR]", error);
      //     continue;
      //   }
      // }

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

      const tweet = await client.generateTweet();

      console.log("[GENERATED TWEET]", tweet);

      if (process.env.AUTO === "true") {
        client.sendTweet(tweet);
      } else {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const userResponse = await new Promise((resolve) => {
          rl.question(`Send this tweet? (yes/no)\n${tweet}\n`, (answer) => {
            rl.close();
            resolve(answer.toLowerCase());
          });
        });

        if (userResponse === "yes") {
          await client
            .sendTweet(tweet)
            .then((tweet) => console.log("[POSTED]", tweet))
            .catch((e) => console.error(e));
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

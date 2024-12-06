import { Scraper } from "goat-x";
import fs from "fs";
import { Cookie } from "tough-cookie";

const COOKIES_FILE = "twitter-cookies.json";

export const init = async (
  client: Scraper,
  {
    username,
    password,
    email,
  }: { username: string; password: string; email?: string }
) => {
  try {
    // Clear any existing cookies first
    await client.clearCookies();

    if (fs.existsSync(COOKIES_FILE)) {
      console.log("[LOGGING IN] - FROM COOKIES");
      const cookieData = JSON.parse(fs.readFileSync(COOKIES_FILE, "utf-8"));
      const cookies = cookieData
        .map((cookieStr: string) => Cookie.parse(cookieStr))
        .filter(Boolean); // Filter out any null cookies

      if (cookies.length) {
        await client.setCookies(cookies);

        // Verify login status
        const loggedIn = await client.isLoggedIn();
        if (!loggedIn) {
          console.log("[COOKIES EXPIRED] - LOGGING IN AGAIN");
          await client.login(username, password, email);
          // Save new cookies
          const newCookies = await client.getCookies();
          const cookieStrings = newCookies.map((cookie) => cookie.toString());
          fs.writeFileSync(
            COOKIES_FILE,
            JSON.stringify(cookieStrings, null, 2)
          );
        }
      }
    } else {
      console.log("[LOGGING IN] - NEW SESSION");
      await client.login(username, password, email);
      const cookies = await client.getCookies();
      const cookieStrings = cookies.map((cookie) => cookie.toString());
      fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookieStrings, null, 2));
    }
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    throw new Error(`Failed to initialize client: ${(error as Error).message}`);
  }
};

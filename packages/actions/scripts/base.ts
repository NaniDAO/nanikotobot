import { getToken } from "../src";

try {
  const result = await getToken("USDC", 8453);
  console.log(result);
} catch (error) {
  console.error(error);
}

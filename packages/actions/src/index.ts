interface DexScreenerToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface DexScreenerPair {
  chainId: string;
  baseToken: DexScreenerToken;
  quoteToken: DexScreenerToken;
}

type ChainId = 1 | 42161 | 10 | 137 | 8453;

const CHAIN_NAMES: Record<number, string> = {
  1: "ethereum",
  42161: "arbitrum",
  10: "optimism",
  137: "polygon",
  8453: "base",
};

async function getToken(
  symbol: string,
  chainId: ChainId
): Promise<DexScreenerToken | null> {
  try {
    const chain = CHAIN_NAMES[chainId];

    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/search/?q=${symbol}&chain=${chain}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const pairs: DexScreenerPair[] = data.pairs || [];
    const chainPairs = pairs.filter((pair) => pair.chainId === chain);

    for (const pair of chainPairs) {
      if (pair.baseToken.symbol.toLowerCase() === symbol.toLowerCase()) {
        return pair.baseToken;
      }
      if (pair.quoteToken.symbol.toLowerCase() === symbol.toLowerCase()) {
        return pair.quoteToken;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching token data:", error);
    return null;
  }
}

// Cache implementation with 5-minute expiry
interface CacheEntry {
  token: DexScreenerToken;
  timestamp: number;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const tokenCache = new Map<string, CacheEntry>();

async function getTokenWithCache(
  symbol: string,
  chainId: ChainId
): Promise<DexScreenerToken | null> {
  const cacheKey = `${symbol.toLowerCase()}-${chainId}`;
  const now = Date.now();

  const cached = tokenCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_EXPIRY) {
    return cached.token;
  }

  const token = await getToken(symbol, chainId);

  if (token) {
    tokenCache.set(cacheKey, {
      token,
      timestamp: now,
    });
  }

  return token;
}

export { getToken, getTokenWithCache, type ChainId };

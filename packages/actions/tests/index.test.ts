import { getToken, getTokenWithCache, ChainId } from "../src/index";
import { expect, test, describe, beforeEach, mock } from "bun:test";

// Mock global fetch
const mockFn = mock(() => ({
  ok: true,
  json: async () => ({ pairs: [] }),
}));

globalThis.fetch = mockFn;

describe("Token Resolver", () => {
  beforeEach(() => {
    mockFn.mockClear();
  });

  // Updated mock data to match DexScreener API response format
  const mockDexScreenerResponse = {
    pairs: [
      {
        chainId: "1",
        baseToken: {
          address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
        },
        quoteToken: {
          address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          symbol: "WETH",
          name: "Wrapped Ether",
          decimals: 18,
        },
      },
      {
        chainId: "42161",
        baseToken: {
          address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
        },
        quoteToken: {
          address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
          symbol: "WETH",
          name: "Wrapped Ether",
          decimals: 18,
        },
      },
    ],
  };

  describe("getToken", () => {
    test("should return correct address for token on specified chain", async () => {
      mockFn.mockImplementationOnce(async () => ({
        ok: true,
        json: async () => mockDexScreenerResponse,
      }));

      const token = await getToken("USDC", 42161);
      expect(token?.address).toBe("0xaf88d065e77c8cc2239327c5edb3a432268e5831");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("should handle case-insensitive symbol matching", async () => {
      mockFn.mockImplementationOnce(async () => ({
        ok: true,
        json: async () => mockDexScreenerResponse,
      }));

      const token = await getToken("usdc", 1);
      expect(token?.address).toBe("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
    });

    test("should return null for non-existent token", async () => {
      mockFn.mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({ pairs: [] }),
      }));

      const token = await getToken("NONEXISTENT", 1);
      expect(token).toBeNull();
    });

    test("should return null for token not on specified chain", async () => {
      mockFn.mockImplementationOnce(async () => ({
        ok: true,
        json: async () => mockDexScreenerResponse,
      }));

      const token = await getToken("LINK", 8453); // LINK not in mock data
      expect(token).toBeNull();
    });

    test("should handle API errors gracefully", async () => {
      mockFn.mockImplementationOnce(async () => {
        throw new Error("API Error");
      });

      const token = await getToken("USDC", 1);
      expect(token).toBeNull();
    });

    test("should handle non-200 responses", async () => {
      mockFn.mockImplementationOnce(async () => ({
        ok: false,
        status: 429,
        json: async () => ({ pairs: [] }), // Add this line
      }));

      const token = await getToken("USDC", 1);
      expect(token).toBeNull();
    });
  });
});

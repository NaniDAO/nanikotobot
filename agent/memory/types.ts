import type { ChromaClient, Collection } from "chromadb";

export type MemoryClientConfig = {
  /** ChromaDB connection params */
  path?: string;
  fetchOptions?: any; // TODO: Get exact type from ChromaDB
  auth?: {
    provider: string;
    credentials?: string;
    token?: string;
  };
  tenant?: string;
  database?: string;
  /** Memory client settings */
  collectionName?: string;
  generateEmbeddings?: (texts: string[]) => Promise<number[][]>;
  distanceFunction?: "cosine" | "l2" | "ip";
  cacheTime?: number;
  pollingInterval?: number;
  type?: string;
  key?: string;
  name?: string;
};

export type MemoryActions = {
  initialize: () => Promise<boolean>;
  addMemory: (memory: {
    content: string;
    metadata?: Record<string, any>;
  }) => Promise<boolean>;
  queryMemories: (
    query: string,
    options?: { nResults?: number; where?: Record<string, any> }
  ) => Promise<any>;
};

export type MemoryClientBase = {
  chroma: ChromaClient;
  collection: Collection | null;
  generateEmbeddings: (texts: string[]) => Promise<number[][]>;
  cacheTime: number;
  pollingInterval: number;
  collectionName: string;
  embeddingDimension: number;
  distanceFunction: "cosine" | "l2" | "ip";
  type: string;
  key: string;
  name: string;
};

export type MemoryClient = MemoryClientBase & MemoryActions;

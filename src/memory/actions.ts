import type { MemoryClient } from "./types";

export async function initialize(client: MemoryClient): Promise<boolean> {
  try {
    client.collection = await client.chroma.getOrCreateCollection({
      name: client.collectionName,
      metadata: {
        dimension: client.embeddingDimension,
        distance_function: client.distanceFunction,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to initialize memory client:", error);
    return false;
  }
}

export async function addMemory(
  client: MemoryClient,
  memory: { content: string; metadata?: Record<string, any> }
): Promise<boolean> {
  if (!client.collection) throw new Error("Client not initialized");

  try {
    const embedding = (await client.generateEmbeddings([memory.content]))[0];

    await client.collection.add({
      ids: [Date.now().toString()],
      documents: [memory.content],
      metadatas: memory.metadata ? [memory.metadata] : undefined,
      embeddings: [embedding],
    });
    return true;
  } catch (error) {
    console.error("Failed to add memory:", error);
    return false;
  }
}

// More actions...
export async function queryMemories(
  client: MemoryClient,
  query: string,
  options: { nResults?: number; where?: Record<string, any> } = {}
) {
  if (!client.collection) throw new Error("Client not initialized");

  try {
    const queryEmbedding = (await client.generateEmbeddings([query]))[0];

    return await client.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: options.nResults || 10,
      where: options.where,
    });
  } catch (error) {
    console.error("Failed to query memories:", error);
    return null;
  }
}

// types.ts
import { ChromaClient, Collection } from "chromadb";

export type MemoryClientConfig = {
  path?: string;
  host?: string;
  port?: number;
  collectionName?: string;
  generateEmbeddings?: (texts: string[]) => Promise<number[][]>;
  distanceFunction?: "cosine" | "l2" | "ip";
  cacheTime?: number;
  pollingInterval?: number;
  type?: string;
  key?: string;
  name?: string;
};

// Define action types that will be available on the client
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

// Base client without actions
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
  uid: string;
};

// Full client type with actions
export type MemoryClient = MemoryClientBase & MemoryActions;

// client.ts
import { OpenAI } from "openai";
import { ChromaClient } from "chromadb";
import { uid } from "./utils/uid.js";
import type { MemoryClient, MemoryClientConfig } from "./types";
import * as actions from "./actions";

const defaultGenerateEmbeddings = (() => {
  const openai = new OpenAI();
  return async function generateEmbeddings(
    texts: string[]
  ): Promise<number[][]> {
    const response = await openai.embeddings.create({
      input: texts,
      model: "text-embedding-ada-002",
    });
    return response.data.map((d) => d.embedding);
  };
})();

export function createMemoryClient(
  parameters: MemoryClientConfig = {}
): MemoryClient {
  const {
    path = "./chroma.db",
    host = "localhost",
    port = 8000,
    collectionName = "memory_store",
    generateEmbeddings = defaultGenerateEmbeddings,
    distanceFunction = "cosine",
    cacheTime = 4_000,
    pollingInterval = 4_000,
    type = "memory",
    key = "memory",
    name = "Memory Client",
  } = parameters;

  const chroma = new ChromaClient({
    path,
    host,
    port,
  });

  const client = {
    chroma,
    collection: null,
    generateEmbeddings,
    cacheTime,
    pollingInterval,
    collectionName,
    embeddingDimension: 1536,
    distanceFunction,
    type,
    key,
    name,
    uid: uid(),
  };

  // Bind actions to client
  return {
    ...client,
    initialize: () => actions.initialize(client),
    addMemory: (memory) => actions.addMemory(client, memory),
    queryMemories: (query, options) =>
      actions.queryMemories(client, query, options),
  };
}

import { OpenAI } from "openai";
import { ChromaClient } from "chromadb";
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
    // ChromaDB params
    path = "http://localhost:8000",
    fetchOptions,
    auth,
    tenant,
    database,
    // Memory client params
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
    fetchOptions,
    auth,
    tenant,
    database,
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
  };

  return {
    ...client,
    initialize: () => actions.initialize(client),
    addMemory: (memory) => actions.addMemory(client, memory),
    queryMemories: (query, options) =>
      actions.queryMemories(client, query, options),
  };
}

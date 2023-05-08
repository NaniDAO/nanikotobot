import { PineconeClient, UpsertRequest } from "@pinecone-database/pinecone";
import {
  QueryRequest,
  QueryResponse,
  UpsertResponse,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { encode, decode } from "gpt-3-encoder";
import { getVectorId } from "@/utils";
import { getTimestampAt } from "@/utils";
import { ChatCompletionRequestMessage } from "openai";
import { createMilvusClient } from "./memory/utils";
import { normalize } from "./memory/generateEmbeddings";



export type ChatCompletionRequestMessageWithTimestamp =
  ChatCompletionRequestMessage & {
    timestamp: number;
  };

const MAX_ITERATIONS = 5;

const pinecone = new PineconeClient();

await pinecone.init({
  environment: "us-central1-gcp",
  apiKey: process.env.PINECONE_API_KEY!,
});

const tokenize = (text: string): number[] => {
  return encode(text);
};


export const storeEmbeddingsWithMetadata = async ({
  document,
  metadata,
  indexName,
  namespace,
}: {
  document: string;
  metadata: object;
  indexName: string;
  namespace?: string;
}): Promise<UpsertResponse> => {
  try {
    const embeddings = await generateEmbeddings(document);
    const index = pinecone.Index(indexName);

    const upsertRequest: UpsertRequest = {
      vectors: embeddings.map((embedding) => ({
        id: getVectorId(),
        values: embedding.embedding,
        metadata: {
          text: embedding.chunk,
          ...metadata,
        },
      })),
      namespace,
    };

    const response: UpsertResponse = await index.upsert({ upsertRequest });

    console.log("Stored ->", response);
    return response;
  } catch (error) {
    console.error("Error upserting embeddings:", error);
    throw error;
  }
};

export const getAllPincone = async () => {
  const index = pinecone.Index("nani-agi");
  const searchVector = [...Array(1536)].map(() => Math.random());
  const response = await index.query({
    queryRequest: {
      vector: searchVector,
      topK: 10000,
      includeValues: true,
      includeMetadata: true,
      filter: {},
      namespace: "telegram",
    },
  });

  return response.matches
}

const getUniqueMessages = (messages) => {
  const seen = new Set();
  return messages.filter((message) => {
    const key = `${message.content}-${message.timestamp}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const migrateFromPineconeToMilvus = async () => {
  const matches = await getAllPincone();
  console.log("Got matches", matches?.length)
  if (!matches) return;
  // we want to normalize the vectors
  const vectors = matches.map((match) => { 
    if (!match) {
      throw new Error("No match");
    }
    if (!match.values) {
      throw new Error("No values");
    }
    if (!match.metadata)  {
      throw new Error("No metadata");
    }

    if (!match.metadata.username) {
      throw new Error("No username");
    }
  
    return ({
    embedding: normalize(match.values),
    source: 'telegram',
    timestamp: match.metadata.timestamp,
    content: `@${match.metadata.username} -> ${match.metadata.content}`,
  })});

  console.log("Got vectors", vectors?.length)
  console.log("Example vector", vectors?.[0])

  const client = createMilvusClient();
  await client.insert({
    collection_name: "nani",
    fields_data: vectors,
    timeout: 100000,
  });
};


export const getRelevantTelegramHistory = async ({
  query,
}: {
  query: string;
}): Promise<string> => {
  
};

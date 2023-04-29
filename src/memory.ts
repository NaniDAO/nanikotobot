import { PineconeClient, UpsertRequest } from '@pinecone-database/pinecone'
import {
  QueryRequest,
  QueryResponse,
  UpsertResponse,
} from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch'
import { encode, decode } from 'gpt-3-encoder'
import { getVectorId } from "./utils";
import { openai } from "./openai";
import { getTimestampAt } from "./utils";
import { ChatCompletionRequestMessage } from 'openai'

const pinecone = new PineconeClient()

await pinecone.init({
  environment: 'us-central1-gcp',
  apiKey: process.env.PINECONE_API_KEY!,
})

const tokenize = (text: string): number[] => {
  return encode(text)
}

const chunkTokens = (tokens: number[], chunkSize = 8191): number[][] => {
  return tokens.reduce((chunks: number[][], token: number) => {
    const lastChunk = chunks[chunks.length - 1]

    if (!lastChunk || lastChunk.length === chunkSize) {
      chunks.push([token])
    } else {
      lastChunk.push(token)
    }

    return chunks
  }, [])
}

const createEmbedding = async (tokens: number[]): Promise<number[]> => {
  try {
    const response = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: tokens,
    })

    return response.data.data[0].embedding
  } catch (error) {
    console.error('Error creating embedding:', error)
    throw error
  }
}

export type EmbeddingResult = {
  chunk: string
  embedding: number[]
}

export const generateEmbeddings = async (
  document: string,
): Promise<
  {
    chunk: string
    embedding: number[]
  }[]
> => {
  try {
    const tokens = tokenize(document)
    const tokenChunks = chunkTokens(tokens)

    const embeddings = await Promise.all(tokenChunks.map(createEmbedding))

    return tokenChunks.map((chunk, index) => ({
      chunk: decode(chunk),
      embedding: embeddings[index],
    }))
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

export const storeEmbeddingsWithMetadata = async ({
  document,
  metadata,
  indexName,
  namespace,
}: {
  document: string
  metadata: object
  indexName: string
  namespace?: string
}): Promise<UpsertResponse> => {
  try {
    const embeddings = await generateEmbeddings(document)
    const index = pinecone.Index(indexName)

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
    }

    const response: UpsertResponse = await index.upsert({ upsertRequest })
    return response
  } catch (error) {
    console.error('Error upserting embeddings:', error)
    throw error
  }
}

export const searchEmbeddings = async ({
  query,
  indexName,
  filter,
  namespace,
  topK = 10,
}: {
  query: string
  indexName: string
  filter?: object
  namespace?: string
  topK?: number
}): Promise<QueryResponse> => {
  try {
    const embeddings = await generateEmbeddings(query)
    const index = pinecone.Index(indexName)

    const queryRequest: QueryRequest = {
      vector: embeddings[0].embedding,
      topK,
      includeValues: true,
      includeMetadata: true,
      filter,
      namespace,
    }

    const response: QueryResponse = await index.query({ queryRequest })
    return response
  } catch (error) {
    console.error('Error querying embeddings:', error)
    throw error
  }
}

type ChatCompletionRequestMessageWithTimestamp = ChatCompletionRequestMessage & {
  timestamp: number;
};

export const getRelevantTelegramHistory = async ({
  query,
  secondsAgo,
  iteration = 0,
}: {
  query: string,
  secondsAgo: number,
  iteration?: number,
}) => {
  try {
    const matches = (await searchEmbeddings({
      query,
      indexName: "nani-agi",
      topK: 10,
      namespace: "telegram",
      filter: {
        timestamp: {
          $gte: getTimestampAt(secondsAgo),
        },
      },
    })).matches

    if (!matches) return []

    let relevantHistory: ChatCompletionRequestMessageWithTimestamp[] = []
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].score === undefined) return
      if (parseFloat(`${matches[i].score}`) > 0.95) {
        relevantHistory.push({
          role: "user",
          content: matches[i]?.metadata?.content as string,
          name: matches[i]?.metadata?.username as string,
          timestamp: matches[i]?.metadata?.timestamp as number,
        })
      }
    }
    if (relevantHistory.length < 10) {
      const nextSecondsAgo = [60, 600, 3600, 86400][iteration] || 86400;
      const additionalHistory = await getRelevantTelegramHistory({
        query,
        secondsAgo: secondsAgo + nextSecondsAgo,
        iteration: iteration + 1,
      });
      if (additionalHistory) {
        relevantHistory = relevantHistory.concat(additionalHistory.slice(0, 10 - relevantHistory.length));
      }
    }

    relevantHistory.sort((a, b) => a.timestamp - b.timestamp);

    return relevantHistory;
  } catch (e) {
    throw e
  }
}

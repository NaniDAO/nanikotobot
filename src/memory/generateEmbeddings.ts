import { createLlmClient } from "@/llm/openai";
import { decode, encode } from "gpt-3-encoder";


const prepareDocument = (document: string): string => {
    return document.toLowerCase().replace(/[^a-z\s]+/g, ' ');
}

export const normalize = (vector: number[]): number[] => {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / norm);
}

export const chunkTokens = (tokens: number[], chunkSize = 8191): number[][] => {
    return tokens.reduce((chunks: number[][], token: number) => {
      const lastChunk = chunks[chunks.length - 1];
  
      if (!lastChunk || lastChunk.length === chunkSize) {
        chunks.push([token]);
      } else {
        lastChunk.push(token);
      }
  
      return chunks;
    }, []);
  };

const createEmbedding = async (tokens: number[]): Promise<number[]> => {
    try {
      const llm  = createLlmClient();
      const response = await llm.createEmbedding({
        model: "text-embedding-ada-002",
        input: tokens,
      });
      const embedding = normalize(response.data.data[0].embedding);
      /// const embedding = response.data.data[0].embedding; 
  
      return embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
};

export const tokenize = (text: string): number[] => {
  return encode(prepareDocument(text));
};

export const generateEmbeddings = async (
    document: string
  ): Promise<
    {
      chunk: string;
      embedding: number[];
    }[]
  > => {
    try {
      const tokens = tokenize(document)
      const tokenChunks = chunkTokens(tokens);
  
      const embeddings = await Promise.all(tokenChunks.map(createEmbedding));
  
      return tokenChunks.map((chunk, index) => ({
        chunk: decode(chunk),
        embedding: embeddings[index],
      }));
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  };
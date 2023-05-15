import { MilvusClient, DataType, MetricType } from "@zilliz/milvus2-sdk-node";
import { config } from "./constants.ts";
import { memoize } from "lodash-es";
import { generateEmbeddings } from "./generateEmbeddings.ts";
import { getTimestampAt } from "@/utils.ts";

export const createMilvusClient = memoize(() => {
    if (!config.uri) throw new Error("MILVUS_URI is not set")
    return new MilvusClient({ address: config.uri, ssl: config.secure, username: config.user, password: config.password, maxRetries: 5, retryDelay: 30, debug: true });
});

export const addToNani = async (content: string, source: string) => {
    const client = createMilvusClient();
    try {
        const embedding = await generateEmbeddings(content)
        const fields_data = embedding.map((e) => {
            return {
                embedding: e.embedding,
                timestamp: getTimestampAt(0),
                content: content,
                source,
            }
        })

        client.loadCollectionSync({
            collection_name: "nani"
        })

        const res = await client.insert({
            collection_name: "nani",
            fields_data,
            timeout: 60000,
        })
        return res
    } catch (e) {
        console.error("Error inserting embeddings:", e);
        throw e;
    } finally {
        client.closeConnection()
    }
}

export const searchCollection = async ({
    query,
    collectionName,
    topK = 10,
}: {
    query: string;
    collectionName: string;
    topK?: number;
}) => {
    try {
        const client = createMilvusClient();
        const embedding = await generateEmbeddings(query).then((embeddings) => {
            let final: number[] = []
            embeddings.forEach((element) => {
                element.embedding.forEach((e) => {
                    final.push(e)
                })
            });
            return final
        });
        

        const res = await client.search({
            collection_name: collectionName,
            vector_type: DataType.FloatVector,
            vectors: [embedding],
            topk: topK,
            metric_type: MetricType.IP,
        });
        return res;
    } catch (e) {
        console.error("Error searching embeddings:", e);
        throw e;
    }
}





import { migrateFromPineconeToMilvus } from "@/memory";
import { searchCollection } from "@/memory/utils";
import { getHistoricalContext } from "@/telegram/history";
import { extractKeywords } from "@/telegram/utils";
import { config } from 'dotenv'

config()

const main = async () => {
  // const collection = await milvusClient.hasCollection({
  //   collection_name: collectionName, m,
  // await migrateFromPineconeToMilvus()
 getHistoricalContext({
    query: 'what is business source license?'
  })
}

main()


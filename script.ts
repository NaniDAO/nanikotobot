import { getPageSummary } from "@/commands/web";
import { addToNani, searchCollection } from "@/memory/utils";
import { getHistoricalContext, getHistory, updateHistory } from "@/telegram/history";

import { config } from 'dotenv'

config()

const main = async () => {
    const summary = await getPageSummary(
        5000,
        'https://goldenlight.mirror.xyz/o5CpltqerVga2ULwztI_jLmlpBe57K-ej2JWkVMJB14'
    )
    summary.chunks.forEach(async (chunk) => {
        await addToNani(
            chunk,
            'https://goldenlight.mirror.xyz/o5CpltqerVga2ULwztI_jLmlpBe57K-ej2JWkVMJB14'
        )
    })
}

main()


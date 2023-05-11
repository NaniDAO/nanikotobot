import { getPageSummary } from "@/commands/web";
import { addToNani } from "@/memory/utils";

import { config } from 'dotenv'

config()

const sleep = async (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const main = async () => {
    try {
    let urls = ["https://forum.makerdao.com/t/the-5-phases-of-endgame/20830"]

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        const summary = await getPageSummary(
            5000,
            url
        )
            
        // create overlapping chunks instead 
        for (const chunk of summary.chunks) {
            await addToNani(
                chunk,
                url,
            )
        }
    
        console.log('Summarized:', url, 'successfully')
        await sleep(5000).then(() => console.log('Sleeping...')).finally(() => console.log('Done sleeping'))
    }

   
    } catch (e) {
        console.log(e)
    }   
}

main()


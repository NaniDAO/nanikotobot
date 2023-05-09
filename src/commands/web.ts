import { google } from "googleapis";
import puppeteer from "puppeteer";
import TurndownService from "turndown";

import { config } from "dotenv";
import { AVG_CHARACTERS_PER_TOKEN, countTokens } from "@/utils";
import { contextWindowSize, getChatCompletion } from "@/llm/openai";

config()

export const googleIt = async (query: string) => {
    const { data } = await google.customsearch("v1").cse.list({
      q: query,
      cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
      key: process.env.GOOGLE_API_KEY,
    });
    return data.items;
}

export const getPageSummary = async (
    maxSummaryTokens: number,
    url: string
  ) => {
    const maxCompletionTokens = Math.round(contextWindowSize["gpt-3.5-turbo"] * 0.9);
  
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const turndownService = new TurndownService().addRule(
      "remove-extraneous-tags",
      {
        filter: ["style", "script", "img"],
        replacement: () => "",
      }
    );
  
    await page.goto(url);
  
    const htmlContent = await page.content();
    
    turndownService.remove(["style", "script"]);
    const markdownContent = turndownService
      .turndown(htmlContent)
      .replace(/\\_/g, "_");
  
    const markdownTokens = countTokens(markdownContent);
  
    const chunks: string[] = [];
    let currentChunkLines: string[] = [];
    let currentChunkTokens = 0;
    for (const line of markdownContent.split("\n")) {
      const lineTokens = countTokens(line);
      if (currentChunkTokens + lineTokens > maxCompletionTokens) {
        chunks.push(currentChunkLines.join("\n"));
        currentChunkLines = [];
        currentChunkTokens = 0;
      }
      currentChunkLines.push(line);
      currentChunkTokens += lineTokens;
    }
  
    let lastChunk = currentChunkLines.join("\n");
    if (countTokens(lastChunk) > maxCompletionTokens) {
      const characterLimit = Math.round(
        maxCompletionTokens * AVG_CHARACTERS_PER_TOKEN
      );
     
      lastChunk = lastChunk.substring(0, characterLimit);
    }
    chunks.push(lastChunk);
  
    const maxChunkSummaryTokens = Math.round(maxSummaryTokens / chunks.length);
   
    const maxChunkSummaryCharacters = Math.round(
      maxChunkSummaryTokens * AVG_CHARACTERS_PER_TOKEN
    );
  
    const chunkSummaryLimitText = `${maxChunkSummaryCharacters} characters`;
  
    const summarizedChunks = await Promise.all(
      chunks.map(async (chunk) =>
        getChatCompletion({
          model: 'gpt-3.5-turbo',
          system_prompt:  `Modify the following markdown excerpt only as much as necessary to bring it under a maximum of ${chunkSummaryLimitText}, preserving the most essential information. In particular, try to preserve links (example: \`[my special link](https://foo.bar/baz/)\`). Write this in the same voice as the original text; do not speak in the voice of someone who is describing it to someone else. For instance, don't use phrases like "The article talks about...". Excerpt to summarize follows:\n\n=============\n\n${chunk}`,
          messages: [
          ],
          callback: (response) => {}
        })
      )
    );
  
    const summary = summarizedChunks
      .map(
        (chunk) =>
          `=== SUMMARIZED CHUNK (${countTokens(
            chunk
          )} tokens) ===\n\n${chunk}\n\n`
      )
      .join("");
    
    await browser.close();
  
    return {
        summary,
        chunks: summarizedChunks,
    }
  }


  


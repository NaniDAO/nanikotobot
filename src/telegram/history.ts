import { searchCollection } from "@/memory/utils";
import { extractKeywords } from "./utils";
import { summarizeHistoricalContext } from "./summarize";
import { ChatCompletionRequestMessageRoleEnum } from "openai";

type Message = {
    username: string;
    message: string;
    timestamp: number;
};
  
const msgHistory: Message[] = []; // max last 10 messages

const addMessageToHistory = (username: string, message: string, timestamp: number): void => {
    const newMessage: Message = { username, message, timestamp };
    msgHistory.push(newMessage);
};

const removeOldestMessage = (): void => {
if (history.length > 10) {
    msgHistory.shift();
}
};

export const updateHistory = (username: string, message: string, timestamp: number): void => {
    addMessageToHistory(username, message, timestamp);
    removeOldestMessage();
};

export const getHistory = (count?: number): Message[] => {
    const currentHistory = msgHistory.map(message => ({ ...message }));
    return count ? currentHistory.slice(-count) : currentHistory;
};

const extractUsernameAndContent = (content: string): { username: string; message: string } => {
    const delimiterIndex = content.indexOf('->');
    const username = content.slice(0, delimiterIndex).trim();
    const message = content.slice(delimiterIndex + 2).trim().toLowerCase();
    return { username, message };
  };
  
const removeOneWordContent = (message: string): boolean => {
    const words = message.split(/\s+/);
    return words.length > 1;
};

const isRelevantContent = (keywords: string[], content: string): boolean => {
    const contentWords = content.toLowerCase().split(/\s+/);
    return keywords.some(keyword => contentWords.includes(keyword));
};

export const getHistoricalContext = async ({
    query,
  }: {
    query: string;
  }): Promise<string> => {
    try {
    let context = ''
    const res = await searchCollection({
        query,
        collectionName: "nani",
        topK: 100,
    });

    if (res.status.error_code != 'Success') {
        throw new Error(`Error searching collection: ${res.status.reason}`);
    } else {
        let matches = res.results;
        let keywords = extractKeywords(query);
        console.log('main', matches.length)
        matches = matches.map((match) => {
            const { username, message } = extractUsernameAndContent(match.content);
            return { ...match, username, content: message };
        });
        
        matches = matches.filter((match) => removeOneWordContent(match.content));
        console.log('removed one word', matches.length, )
        matches = matches.filter((match) => isRelevantContent(keywords, match.content));
        console.log('removed irrelevant', keywords, matches.length)
        matches = sortMatches(matches, 0.5, 0.8);
        console.log('sorted', matches, matches.length)
        const topMatches = matches.map((match) => ({
            name: match.username,
            content: match.content,
            role: match.username === "@nanikotobot" ? 'assistant' : 'user' as ChatCompletionRequestMessageRoleEnum,
            timestamp: match.timestamp,
        }))
        console.log('topMatches', topMatches, topMatches.length)

        context = await summarizeHistoricalContext({
            historicalContext: topMatches,
            query,
        });
       
    }

    return context
    } catch (e) {
        console.error("Error searching embeddings:", e);
        throw e;
    }
};


const normalize = (value: number, min: number, max: number): number => {
    return (value - min) / (max - min);
  };
  
const weightedSum = (scoreWeight: number, timeWeight: number, normalizedScore: number, normalizedTime: number): number => {
return scoreWeight * normalizedScore + timeWeight * normalizedTime;
};
  
const sortMatches = (matches: any[], scoreWeight: number, timeWeight: number): any[] => {
const minScore = Math.min(...matches.map((match) => match.score));
const maxScore = Math.max(...matches.map((match) => match.score));
const minTime = Math.min(...matches.map((match) => match.timestamp));
const maxTime = Math.max(...matches.map((match) => match.timestamp));

return matches.sort((a, b) => {
    const normalizedScoreA = normalize(a.score, minScore, maxScore);
    const normalizedScoreB = normalize(b.score, minScore, maxScore);
    const normalizedTimeA = normalize(a.timestamp, minTime, maxTime);
    const normalizedTimeB = normalize(b.timestamp, minTime, maxTime);

    const weightedSumA = weightedSum(scoreWeight, timeWeight, normalizedScoreA, normalizedTimeA);
    const weightedSumB = weightedSum(scoreWeight, timeWeight, normalizedScoreB, normalizedTimeB);

    return weightedSumB - weightedSumA;
});
};


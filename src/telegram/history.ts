import { searchCollection } from "@/memory/utils";
import { extractKeywords } from "./utils";
import { summarizeHistoricalContext } from "./summarize";
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from "openai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type Message = {
    username: string;
    message: string;
    timestamp: number;
};
  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const historyFilePath = path.join(__dirname, '..', '..', 'store', 'history.json');

const getHistoryFromFile = (): Message[] => {
    if (!fs.existsSync(historyFilePath)) {
        fs.writeFileSync(historyFilePath, JSON.stringify([]));
    }
    const historyData = fs.readFileSync(historyFilePath, 'utf-8');
    return JSON.parse(historyData);
};

const updateHistoryFile = (history: Message[]): void => {
    fs.writeFileSync(historyFilePath, JSON.stringify(history));
};

const addMessageToHistory = (username: string, message: string, timestamp: number): Message[] => {
    const history = getHistoryFromFile();
    const newMessage: Message = { username, message, timestamp };
    history.push(newMessage);
    return history;
};

const removeOldestMessage = (history: Message[]): Message[] => {
    if (history.length > 10) {
        history.shift();
    }
    return history;
};

export const updateHistory = (username: string, message: string, timestamp: number): void => {
    const updatedHistory = addMessageToHistory(username, message, timestamp);
    const historyWithOldestRemoved = removeOldestMessage(updatedHistory);
    updateHistoryFile(historyWithOldestRemoved);
};

export const getHistory = (count?: number): Message[] => {
    const currentHistory = getHistoryFromFile().map(message => ({ ...message }));
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
    history,
  }: {
    history: ChatCompletionRequestMessage[];
  }): Promise<string> => {
    try {

    let context = ''
 
    const query = history.map((message) => message.content).join(' ')

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
     
        matches = matches.map((match) => {
            const { username, message } = extractUsernameAndContent(match.content);
            return { ...match, username, content: message };
        });
        
        matches = matches.filter((match) => removeOneWordContent(match.content));

        matches = matches.filter((match) => isRelevantContent(keywords, match.content));
       
        matches = sortMatches(matches, 0.5, 0.8);
      
        const topMatches = matches.map((match) => ({
            name: match.username,
            content: match.content,
            role: match.username === "@nanikotobot" ? 'assistant' : 'user' as ChatCompletionRequestMessageRoleEnum,
            timestamp: match.timestamp,
        }))
        console.log('topMatches', topMatches.length)

        context = await summarizeHistoricalContext({
            historicalContext: topMatches.slice(0, 10),
            query,
        });
       
    }

    return context
    } catch (e) {
        console.error("Error getting Historical context:", e);
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


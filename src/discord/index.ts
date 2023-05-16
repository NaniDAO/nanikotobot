import { getReply } from '@/commands/reply';
import { addToNani } from '@/memory/utils';
import { createMessageToSave } from '@/telegram/utils';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { config } from 'dotenv';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai';

config()

export function initDiscord() {
const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('messageCreate', async (message: Message) => {
    try {
    if (!message.content.startsWith('.') && !message.author.bot) {
        await addToNani(createMessageToSave({ author: message.author.username, message: message.content }), "discord");
        const messages = await message.channel.messages.fetch({ limit: 2 });
        const messageChain: ChatCompletionRequestMessage[] = [...messages.values()].map((message) => {
            return {
                name: message.author.username,
                content: message.content,
                role: message.author.bot ? 'assistant' : 'user' as ChatCompletionRequestMessageRoleEnum,
            };
        }).reverse(); 
       
        const response = await getReply({
            platform: 'discord',
            messages: [...messageChain],
        });
        if (response) {
            const replied = await message.channel.send(response);
            await addToNani(createMessageToSave({ author: replied.author.username, message: response }), "discord");  
        }      
    } } catch (e) {
        console.error(e);
    }
});

client.login(DISCORD_TOKEN);
}

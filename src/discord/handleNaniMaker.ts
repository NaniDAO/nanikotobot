import { Message } from "discord.js";

// Parse message content
const parseMessageContent = (content: string) => {
    const parts = content.includes(' --no ') ? content.split(' --no ') : [content];
    const prompt = parts[0].replace('!imagine ', '');
    const negative_prompt = parts.length > 1 ? parts[1] : undefined;
    return { prompt, negative_prompt };
};

export const handleNaniMaker = async (message: Message) => {
    const ENDPOINT = process.env.NANI_MAKER_ENDPOINT;

    if (!ENDPOINT) {
        console.error('[nani-maker] error ->', 'NANI_MAKER_ENDPOINT not set')
        return
    }

    const { prompt, negative_prompt } = parseMessageContent(message.content);

    console.info('[nani-maker] prompt ->', prompt, 'negative_prompt ->', negative_prompt)
    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: prompt,
            negative_prompt: negative_prompt ? negative_prompt : 'bad art',
        }),
    });

    if (response.ok) {
        const data = await response.json();
        const buffer = Buffer.from(data.image, 'base64');
        const file = { attachment: buffer, name: 'image.png' };
        message.reply({ files: [file] });
    } else {
        console.error('[nani-maker] error ->', response.body)
    }
};

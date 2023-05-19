import { Message } from "discord.js";

export const handleNaniMaker = async (message: Message) => {
    const ENDPOINT = process.env.NANI_MAKER_ENDPOINT;

    if (!ENDPOINT) {
        console.error('[nani-maker] error ->', 'NANI_MAKER_ENDPOINT not set')
        return
    }
    
    // Parse message content
    const parts = message.content.split(' --no ');
    const prompt = parts[0].replace('!imagine ', '');
    let negative_prompt = undefined;

    if (parts.length > 1) {
        negative_prompt = parts[1];
    }

    console.info('[nani-maker] prompt ->', prompt, 'negative_prompt ->', negative_prompt)
    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: prompt,
            negative_prompt: negative_prompt,
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

# nanikotobot

nanikotobot is a minimal Telegram bot powered by OpenAI. It has the ability to remember and learn from conversations in a group chat, utilizing Pinecone for storing and querying the conversation history. This enables the bot to evolve its understanding and knowledge based on the interactions it has within the group chat.

## Features

- Utilizes gpt-4 and gpt-3.5-turbo for generating intelligent responses.
- Stores conversation history in Pinecone for long-term memory.
- Queries relevant historical context from Pinecone before responding.
- Evolves with the group chat by learning from past conversations.

## Getting Started

### Prerequisites

To run this project, you need to have the following:

- Node.js (v14 or higher)
- A Telegram Bot API Token
- OpenAI Key

### Installation

1. Clone the repository:

```
git clone https://github.com/kalidao/nanikotobot.git
```

2. Navigate to the project directory:

```
cd nanikotobot
```

3. Install the required dependencies:

```
pnpm i
```

4. Create a `.env` filekalidao in the project root directory and add the following variables:

```
TELEGRAM_TOKEN=your_telegram_bot_token
PINECONE_API_KEY=your_pinecone_api_key
OPENAI_API_KEY=your_openai_api_key
```

Replace `your_telegram_bot_token`, `your_pinecone_api_key`, and `your_openai_api_key` with the appropriate tokens.

5. Start the bot:

```
pnpm start
```

## Usage

To interact with the bot, simply invite it to a group chat on Telegram and mention its name (e.g., `@nanikotobot`) in your messages. The bot will intelligently respond to your messages based on the historical context it has learned from past conversations within the group.

## Join the NANI DAO Telegram Group

Nani currently resides in the NANI DAO Telegram group. You can join the group and interact with the bot here: [https://t.me/+NKbETPq0J9UyODk9](https://t.me/+NKbETPq0J9UyODk9)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

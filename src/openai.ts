import { config } from 'dotenv'
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from 'openai'
import { SYSTEM_PROMPT } from './system_prompt'

config()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const MAX_RETRIES = 5
const INITIAL_BACKOFF_MS = 500

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const parseChunk = (chunk: Buffer): string[] =>
  chunk
    .toString('utf8')
    .split('\n')
    .filter((line: string) => line.trim().startsWith('data: '))

const extractMessage = (line: string): string => line.replace(/^data: /, '')

const processLines = (
  lines: string[],
  callback: (message: string) => void,
): boolean => {
  for (const line of lines) {
    const message = extractMessage(line)
    if (message === '[DONE]') {
      return true
    }

    const json = JSON.parse(message)
    const token = json.choices[0].delta.content
    if (token) {
      callback(token)
    }
  }
  return false
}

export const getChatCompletion = async ({
  message,
}: {
  message: ChatCompletionRequestMessage
}): Promise<string> => {
  try {
    const openai = new OpenAIApi(configuration)
    let reply = ''
    const callback = (message: string) => {
      console.clear()
      console.log(message)
      reply += message
    }

    const response = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          message
        ],
        stream: true,
        stop: '/STOP/',
        max_tokens: 100,
      },
      {
        responseType: 'stream',
      },
    )

    for await (const chunk of (response.data as unknown) as AsyncIterable<
      Buffer
    >) {
      const lines = parseChunk(chunk)
      if (processLines(lines, callback)) {
        break
      }
    }

    return reply
  } catch (e) {
    if (e?.isAxiosError) {
      throw new Error(e)
    } else {
      throw new Error('Unknown Error')
    }
  }
}

import { v4 as uuid } from 'uuid'

export const getVectorId = () => {
  return uuid().toString()
}

// returns UNIX timestamp `seconds` seconds ago
export const getTimestampAt = (seconds: number) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timestampSecondsAgo = currentTimestamp - seconds;
  return timestampSecondsAgo;
}

export const unixTimestampToISO = (timestamp: number) => {
  if (!timestamp) {
    return ''
  }

  return new Date(timestamp * 1000).toISOString()
}

const getMessageChain = async (message, chain = []) => {
  if (message.reply_to_message) {
    chain.unshift({
      role: "user",
      content: message.reply_to_message.text,
      name: message.reply_to_message.from?.username,
    });
    return getMessageChain(message.reply_to_message, chain);
  } else {
    return chain;
  }
};

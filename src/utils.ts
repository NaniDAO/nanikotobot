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

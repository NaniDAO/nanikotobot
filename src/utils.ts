import { v4 as uuid } from 'uuid'

export const getVectorId = () => {
  return uuid().toString()
}

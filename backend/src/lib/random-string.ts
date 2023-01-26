/* Copyright Contributors to the Open Cluster Management project */
const randomCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function randomString(length: number, base = randomCharacters.length): string {
  if (base > randomCharacters.length || base <= 0) base = randomCharacters.length
  let text = ''
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * base) % base
    text += randomCharacters.charAt(index)
  }
  return text
}

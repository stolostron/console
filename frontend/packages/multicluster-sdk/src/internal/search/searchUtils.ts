/* Copyright Contributors to the Open Cluster Management project */
export const convertStringToQuery = (searchText: string, queryResultLimit: number) => {
  const searchTokens = searchText.split(' ')
  const keywords = searchTokens.filter((token) => token !== '' && token.indexOf(':') < 0)
  const filters = searchTokens
    .filter((token) => token.indexOf(':') >= 0)
    .map((f) => {
      const splitIdx = f.indexOf(':')
      const property = f.substring(0, splitIdx)
      const values = f.substring(splitIdx + 1)
      return { property, values: values.split(',') }
    })

  return {
    keywords,
    filters,
    limit: queryResultLimit,
  }
}

export function getCookie(name: string) {
  if (!document?.cookie) return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookie = parts[parts.length - 1]
    if (cookie) return cookie.split(';').shift()
  }
}

/* Copyright Contributors to the Open Cluster Management project */
import { HttpsProxyAgent } from 'https-proxy-agent'
import { getProxyForUrl } from 'proxy-from-env'
import { HttpProxyAgent } from 'http-proxy-agent'
import { logger } from './logger'

let httpsProxy: { url: string; proxy: HttpsProxyAgent<string> } | undefined = undefined
let httpProxy: { url: string; proxy: HttpProxyAgent<string> } | undefined = undefined

export function getProxyAgent(url: string) {
  const proxyUrl = getProxyForUrl(url)
  if (proxyUrl) {
    logger.info(`Using proxy URL ${proxyUrl} for ${url}`)

    const proxyUrlObject = new URL(proxyUrl)
    if (proxyUrlObject.protocol === 'https:') {
      logger.info(`Using proxy URL ${proxyUrl} for ${url}`)
      if (httpsProxy?.url !== proxyUrl) {
        httpsProxy = { url: proxyUrl, proxy: new HttpsProxyAgent(proxyUrl) }
      }
      return httpsProxy.proxy
    } else if (proxyUrlObject.protocol === 'http:') {
      if (httpProxy?.url !== proxyUrl) {
        httpProxy = { url: proxyUrl, proxy: new HttpProxyAgent(proxyUrl) }
      }
      return httpProxy.proxy
    }
  }
  return undefined
}

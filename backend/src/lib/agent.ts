/* Copyright Contributors to the Open Cluster Management project */
import { Agent } from 'https'
import { getCACertificate, getServiceCACertificate } from './serviceAccountToken'
import { HttpsProxyAgent } from 'https-proxy-agent'

let defaultAgent: Agent
export function getDefaultAgent() {
  if (!defaultAgent) {
    defaultAgent = new Agent({ ca: getCACertificate() })
  }
  return defaultAgent
}

let serviceAgent: Agent
export function getServiceAgent() {
  if (!serviceAgent) {
    serviceAgent = new Agent({ ca: getServiceCACertificate() })
  }
  return serviceAgent
}

let proxyAgent: HttpsProxyAgent<string>
export function getProxyAgent() {
  if (!proxyAgent && process.env.HTTPS_PROXY) {
    proxyAgent = new HttpsProxyAgent(process.env.HTTPS_PROXY)
  }
  return proxyAgent
}

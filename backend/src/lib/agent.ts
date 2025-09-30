/* Copyright Contributors to the Open Cluster Management project */
import { Agent } from 'https'
import { getCACertificate, getServiceCACertificate } from './serviceAccountToken'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { AgentOptions } from 'http'

const COMMON_AGENT_OPTIONS: Partial<AgentOptions> = {
  keepAlive: true, // Reuse connections
  keepAliveMsecs: 30000, // 30 seconds keep alive
  timeout: 30000, // 30 second socket timeout
}

let defaultAgent: Agent
export function getDefaultAgent() {
  if (!defaultAgent) {
    defaultAgent = new Agent({
      ca: getCACertificate(),
      ...COMMON_AGENT_OPTIONS,
    })
  }
  return defaultAgent
}

let serviceAgent: Agent
export function getServiceAgent() {
  if (!serviceAgent) {
    serviceAgent = new Agent({ ca: getServiceCACertificate(), ...COMMON_AGENT_OPTIONS })
  }
  return serviceAgent
}

let proxyAgent: HttpsProxyAgent<string>
export function getProxyAgent() {
  if (!proxyAgent && process.env.HTTPS_PROXY) {
    proxyAgent = new HttpsProxyAgent(process.env.HTTPS_PROXY, COMMON_AGENT_OPTIONS)
  }
  return proxyAgent
}

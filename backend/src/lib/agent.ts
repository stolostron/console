/* Copyright Contributors to the Open Cluster Management project */
import { HttpsProxyAgent } from 'https-proxy-agent'
import type { AgentOptions } from 'node:https'
import { Agent } from 'node:https'
import { getCACertificates } from 'node:tls'
import { getCACertificate, getServiceCACertificate } from './serviceAccountToken'

const COMMON_AGENT_OPTIONS: Partial<AgentOptions> = {
  keepAlive: true, // Reuse connections
  keepAliveMsecs: 30000, // 30 seconds keep alive
  timeout: 30000, // 30 second socket timeout
}

let defaultAgent: Agent
export function getDefaultAgent() {
  if (!defaultAgent) {
    defaultAgent = new Agent({
      ca: getCACertificate(() => {
        defaultAgent = undefined
      }),
      ...COMMON_AGENT_OPTIONS,
    })
  }
  return defaultAgent
}

let serviceAgent: Agent
export function getServiceAgent() {
  if (!serviceAgent) {
    serviceAgent = new Agent({
      ca: getServiceCACertificate(() => {
        serviceAgent = undefined
      }),
      ...COMMON_AGENT_OPTIONS,
    })
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

// Insights upgrade-risk-prediction requests may target either the public console.redhat.com
// (default) or an on-cluster gateway like the Insights Operator proxy service (service-ca signed)
// or an externally hosted on-prem instance (trusted via NODE_EXTRA_CA_CERTS), so this agent trusts
// all three rather than just the public roots used by getDefaultAgent().
let insightsAgent: Agent
export function getInsightsAgent() {
  if (!insightsAgent) {
    insightsAgent = new Agent({
      ca: [
        ...getCACertificates('default'),
        ...([] as string[]).concat(
          getServiceCACertificate(() => {
            insightsAgent = undefined
          })
        ),
      ],
      ...COMMON_AGENT_OPTIONS,
    })
  }
  return insightsAgent
}

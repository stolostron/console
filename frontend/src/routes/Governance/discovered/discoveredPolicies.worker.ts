/* Copyright Contributors to the Open Cluster Management project */
import { grouping } from './grouping'

const { createMessage } = grouping()

addEventListener('message', (event: MessageEvent) => {
  const {
    data: searchData,
    subscriptions,
    helmReleases,
    channels,
    resolveSourceStr,
    getSourceTextStr,
    parseStringMapStr,
    parseDiscoveredPoliciesStr,
  } = event.data as {
    data: unknown
    subscriptions: unknown
    helmReleases: unknown
    channels: unknown
    resolveSourceStr: string
    getSourceTextStr: string
    parseStringMapStr: string
    parseDiscoveredPoliciesStr: string
  }

  const result = createMessage(
    searchData,
    helmReleases as any[],
    channels as any[],
    subscriptions as any[],
    resolveSourceStr,
    getSourceTextStr,
    parseStringMapStr,
    parseDiscoveredPoliciesStr
  )

  postMessage(result)
})

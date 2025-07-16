/* Copyright Contributors to the Open Cluster Management project */
import { fetchHubConfiguration } from './cachedHubConfiguration'

export async function isHubRequest(cluster?: string) {
  return !cluster || cluster === (await fetchHubConfiguration())?.localHubName
}

/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { k8sPatch } from '@openshift-console/dynamic-plugin-sdk'
import { OptionsPatch, getResourceURL } from '../internal/apiRequests'

export async function fleetK8sPatch<R extends K8sResourceCommon>(options: OptionsPatch<R>): Promise<R> {
  const { resource, model, ns, name } = options ?? {}

  const cluster = options.cluster || resource.cluster

  if (cluster === undefined) {
    return k8sPatch<R>(options)
  }

  const headers: Record<string, string> = {}
  if (Array.isArray(options.data)) {
    headers['Content-Type'] = 'application/json-patch+json'
  } else {
    headers['Content-Type'] = 'application/merge-patch+json'
  }

  const requestPath = await getResourceURL({
    model,
    ns: resource?.metadata?.namespace || ns,
    name: resource?.metadata?.name || name,
    cluster,
    queryParams: options.queryParams,
  })

  return consoleFetchJSON(requestPath, 'PATCH', { body: JSON.stringify(options.data), headers }) as Promise<R>
}

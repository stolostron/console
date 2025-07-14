/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk'
import { OptionsCreate, getResourceURL, COMMON_HEADERS } from '../internal/apiRequests'

export async function fleetK8sCreate<R extends K8sResourceCommon>(options: OptionsCreate<R>): Promise<R> {
  const { data, model, ns, name } = options

  const cluster = options.cluster || data.cluster

  if (cluster === undefined) {
    return k8sCreate<R>(options)
  }
  const requestPath = await getResourceURL({
    model,
    ns: data?.metadata?.namespace || ns,
    name: data.metadata?.name || name,
    cluster,
    queryParams: options.queryParams,
  })

  return consoleFetchJSON(requestPath, 'POST', {
    body: JSON.stringify(data),
    headers: COMMON_HEADERS,
  }) as Promise<R>
}

/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { k8sUpdate } from '@openshift-console/dynamic-plugin-sdk'
import { OptionsUpdate, getResourceURL } from '../internal/apiRequests'

export async function fleetK8sUpdate<R extends K8sResourceCommon>(options: OptionsUpdate<R>): Promise<R> {
  const { model, name, ns, data } = options

  const cluster = options.cluster || data.cluster

  if (cluster === undefined) {
    return k8sUpdate(options)
  }

  const requestPath = await getResourceURL({
    model,
    ns: data?.metadata?.namespace || ns,
    name: data?.metadata?.name || name,
    cluster: cluster,
    queryParams: options.queryParams,
  })

  return consoleFetchJSON(requestPath, 'PUT') as Promise<R>
}

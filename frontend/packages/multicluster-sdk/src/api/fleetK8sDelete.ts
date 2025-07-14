import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { k8sDelete } from '@openshift-console/dynamic-plugin-sdk'
import { OptionsDelete, getResourceURL, COMMON_HEADERS } from '../internal/apiRequests'

export async function fleetK8sDelete<R extends K8sResourceCommon>(options: OptionsDelete<R>): Promise<R> {
  const { model, name, ns, json, resource } = options

  const cluster = resource?.cluster || options?.cluster

  if (cluster === undefined) {
    return k8sDelete(options)
  }

  const { propagationPolicy } = model
  const jsonData = json ?? (propagationPolicy && { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy })

  const requestPath = await getResourceURL({
    model,
    ns: ns || resource?.metadata?.namespace,
    name: name || resource?.metadata?.name,
    cluster,
    queryParams: options?.queryParams,
  })

  return consoleFetchJSON(requestPath, 'DELETE', {
    headers: COMMON_HEADERS,
    body: JSON.stringify(jsonData),
  }) as Promise<R>
}

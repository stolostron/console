/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { k8sGet } from '@openshift-console/dynamic-plugin-sdk'
import { OptionsGet, getResourceURL } from '../internal/apiRequests'

export async function fleetK8sGet<R extends K8sResourceCommon>(options: OptionsGet): Promise<R> {
  const { model, name, ns, cluster } = options

  if (cluster === undefined) {
    return k8sGet<R>(options)
  }

  const requestPath = await getResourceURL({ model, ns, name, cluster, queryParams: options.queryParams })

  return consoleFetchJSON(requestPath, 'GET') as Promise<R>
}

/* Copyright Contributors to the Open Cluster Management project */
export const getURLSearchParam = (resource: any) => {
  const params = new URLSearchParams()

  if (resource.cluster) {
    params.append('cluster', resource.cluster)
  }
  if (resource.kind) {
    params.append('kind', resource.kind)
  }
  if (resource.apigroup && resource.apiversion) {
    params.append('apiversion', `${resource.apigroup}/${resource.apiversion}`)
  } else if (!resource.apigroup && resource.apiversion) {
    params.append('apiversion', resource.apiversion)
  }
  if (resource.namespace) {
    params.append('namespace', resource.namespace)
  }
  if (resource.name) {
    params.append('name', resource.name)
  }
  if (resource._hubClusterResource && resource._hubClusterResource === 'true') {
    params.append('_hubClusterResource', 'true')
  }

  return `?${params.toString()}`
}

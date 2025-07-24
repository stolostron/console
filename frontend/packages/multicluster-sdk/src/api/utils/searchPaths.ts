/* Copyright Contributors to the Open Cluster Management project */
export const getURLSearchParam = (resource: any) => {
  let searchString = `cluster=${resource.cluster}`

  if (resource.kind) {
    searchString = `${searchString}&kind=${resource.kind}`
  }
  if (resource.apigroup && resource.apiversion) {
    searchString = `${searchString}&apiversion=${resource.apigroup}/${resource.apiversion}`
  } else if (!resource.apigroup && resource.apiversion) {
    searchString = `${searchString}&apiversion=${resource.apiversion}`
  }
  if (resource.namespace) {
    searchString = `${searchString}&namespace=${resource.namespace}`
  }
  if (resource.name) {
    searchString = `${searchString}&name=${resource.name}`
  }
  if (resource._hubClusterResource && resource._hubClusterResource === 'true') {
    searchString = `${searchString}&_hubClusterResource=true`
  }
  return `?${encodeURIComponent(searchString)}`
}

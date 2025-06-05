/* Copyright Contributors to the Open Cluster Management project */

export function getBackendUrl() {
  return Promise.resolve('/api/proxy/plugin/acm/console/multicloud')
  // if (process.env.NODE_ENV === 'test') {
  //   return process.env.JEST_DEFAULT_HOST ?? ''
  // }
  // if (process.env.MODE === 'plugin') {
  //   const proxyPath = process.env.PLUGIN_PROXY_PATH
  //   const value = proxyPath ? `${proxyPath}${process.env.REACT_APP_BACKEND_PATH}` : ''
  //   return value
  // }
  // /* istanbul ignore next */
  // return process.env.REACT_APP_BACKEND_PATH ?? ''
}

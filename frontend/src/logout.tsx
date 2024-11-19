/* Copyright Contributors to the Open Cluster Management project */
import { noop } from 'lodash'
import { fetchGet, getBackendUrl } from './resources/utils'

export async function tokenExpired() {
  if (process.env.NODE_ENV === 'production') {
    logout()
  } else {
    window.location.href = `${getBackendUrl()}/login`
  }
}

export async function logout() {
  const tokenEndpointResult = await fetchGet<{ token_endpoint: string }>(getBackendUrl() + '/configure')
  await fetchGet(getBackendUrl() + '/logout').catch(noop)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('type', 'hidden')
  iframe.name = 'hidden-form'
  document.body.appendChild(iframe)

  const form = document.createElement('form')
  form.method = 'POST'
  form.target = 'hidden-form'
  const url = new URL(tokenEndpointResult.data.token_endpoint)
  form.action = `${url.protocol}//${url.host}/logout`
  document.body.appendChild(form)

  form.submit()

  await new Promise((resolve) => setTimeout(resolve, 500))

  location.pathname = '/'
}

import { fetchRetry, getBackendUrl } from '~/resources/utils'

export function getWizardData(client_id: string, client_secret: string, url: string, additionalData?: any) {
  const backendURLPath = getBackendUrl() + url
  const abortController = new AbortController()
  return fetchRetry<any>({
    method: 'POST',
    url: backendURLPath,
    data: {
      service_account_id: client_id,
      service_account_secret: client_secret,
      ...additionalData,
    },
    signal: abortController.signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    disableRedirectUnauthorizedLogin: true,
  }).then((res) => {
    if (res.data?.kind === 'Error' || res.data?.body?.kind === 'Error') {
      const errorBody = res.data?.body ?? res.data
      throw new Error(errorBody.reason ?? 'Unknown error')
    }
    return res.data
  })
}

export const getWizardAWSAccountIds = (client_id: string, client_secret: string, additionalData?: any) =>
  getWizardData(client_id, client_secret, '/aws-account-ids', additionalData)
export const getWizardAwsBillingAccounts = (client_id: string, client_secret: string, additionalData?: any) =>
  getWizardData(client_id, client_secret, '/aws-billing-accounts', additionalData)

/* Copyright Contributors to the Open Cluster Management project */

import {
  AwsAccountIdsResponse,
  AwsAccountPayload,
  OIDCConfigResponse,
  CloudProviderResponse,
  ClusterNameCheckPayload,
  ClusterNameUniquenessResponse,
  OCMRoleResponse,
  OrganizationQuotaResponse,
  RoleARNsResponse,
  UserRoleResponse,
  WizardBasePayload,
  WizardErrorResponse,
  OpenshiftVersionResponse,
} from '~/resources'
import { fetchRetry, getBackendUrl } from '~/resources/utils'

function isWizardError(data: unknown): data is WizardErrorResponse {
  const d = data as WizardErrorResponse
  return d?.kind === 'Error' || d?.body?.kind === 'Error'
}

export function getWizardData<TResponse, TPayload extends Record<string, unknown> = Record<string, never>>(
  client_id: string,
  client_secret: string,
  url: string,
  signal?: AbortSignal,
  additionalData?: TPayload
): Promise<TResponse> {
  const backendURLPath = getBackendUrl() + url
  return fetchRetry<TResponse>({
    method: 'POST',
    url: backendURLPath,
    data: {
      service_account_id: client_id,
      service_account_secret: client_secret,
      ...additionalData,
    } as WizardBasePayload & TPayload,
    signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    disableRedirectUnauthorizedLogin: true,
  }).then((res) => {
    if (isWizardError(res.data)) {
      const errorBody = res.data?.body ?? res.data
      throw new Error(errorBody.reason ?? 'Unknown error')
    }
    return res.data
  })
}

export const getWizardAWSAccountIds = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal
): Promise<AwsAccountIdsResponse> =>
  getWizardData<AwsAccountIdsResponse>(client_id, client_secret, '/aws-account-ids', signal)

export const getWizardAwsBillingAccounts = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal
): Promise<OrganizationQuotaResponse> =>
  getWizardData<OrganizationQuotaResponse>(client_id, client_secret, '/aws-billing-accounts', signal)

export const getWizardOIDCConfigs = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal,
  additionalData?: AwsAccountPayload
): Promise<OIDCConfigResponse> =>
  getWizardData<OIDCConfigResponse, AwsAccountPayload>(
    client_id,
    client_secret,
    '/oidc-configs',
    signal,
    additionalData
  )

export const getWizardRegions = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal,
  additionalData?: Record<string, unknown>
): Promise<CloudProviderResponse> =>
  getWizardData<CloudProviderResponse, Record<string, unknown>>(
    client_id,
    client_secret,
    '/regions',
    signal,
    additionalData
  )

export const getWizardClusterNameUniqueness = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal,
  additionalData?: ClusterNameCheckPayload
): Promise<ClusterNameUniquenessResponse> =>
  getWizardData<ClusterNameUniquenessResponse, ClusterNameCheckPayload>(
    client_id,
    client_secret,
    '/cluster-name-check',
    signal,
    additionalData
  )

export const getWizardRoleARNs = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal,
  additionalData?: AwsAccountPayload
): Promise<RoleARNsResponse> =>
  getWizardData<RoleARNsResponse, AwsAccountPayload>(client_id, client_secret, '/sts-role-arns', signal, additionalData)

export const getWizardOCMRoleARN = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal,
  additionalData?: AwsAccountPayload
): Promise<OCMRoleResponse> =>
  getWizardData<OCMRoleResponse, AwsAccountPayload>(client_id, client_secret, '/sts-ocm-role', signal, additionalData)

export const getWizardUserRoleARN = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal
): Promise<UserRoleResponse> => getWizardData<UserRoleResponse>(client_id, client_secret, '/sts-user-role', signal)

export const getWizardVersions = (
  client_id: string,
  client_secret: string,
  signal?: AbortSignal
): Promise<OpenshiftVersionResponse> =>
  getWizardData<OpenshiftVersionResponse>(client_id, client_secret, '/openshift-versions', signal)

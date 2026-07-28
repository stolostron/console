/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import get from 'get-value'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { catchInternalServerError, respondBadRequest } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { getServiceAccountToken } from '../lib/serviceAccountToken'

export enum SupportedOperator {
  ansible = 'ansible-automation-platform-operator',
  gitOps = 'openshift-gitops-operator',
  acm = 'advanced-cluster-management',
  kubevirt = 'kubevirt-hyperconverged',
}
type OperatorCheckRequest = {
  operator: SupportedOperator
}
type OperatorCheckResponse = {
  operator: SupportedOperator
  installed: boolean
  version?: string
}
function isOperatorCheckRequest(value: unknown): value is OperatorCheckRequest {
  if (value && typeof value === 'object' && 'operator' in value) {
    return Object.values(SupportedOperator).includes(value.operator as SupportedOperator)
  }
  return false
}

function getSubscriptionInstall(
  items: unknown[],
  operator: SupportedOperator
): { installed: boolean; version?: string } {
  const subscription = items.find(
    (item: unknown) => typeof item === 'object' && get(item, 'spec.name') === operator
  ) as object | undefined
  const subscriptionConditions = get(subscription, 'status.conditions') as unknown[]
  if (
    Array.isArray(subscriptionConditions) &&
    subscriptionConditions?.find(
      (condition: unknown) =>
        typeof condition === 'object' &&
        get(condition, 'type') === 'CatalogSourcesUnhealthy' &&
        get(condition, 'status') === 'False'
    )
  ) {
    return {
      installed: true,
      version: get(subscription, 'status.installedCSV') as string | undefined,
    }
  }
  return { installed: false }
}

function getClusterExtensionInstall(
  items: unknown[],
  operator: SupportedOperator
): { installed: boolean; version?: string } {
  const clusterExtension = items.find(
    (item: unknown) => typeof item === 'object' && get(item, 'spec.source.catalog.packageName') === operator
  ) as object | undefined
  const conditions = get(clusterExtension, 'status.conditions') as unknown[]
  if (
    Array.isArray(conditions) &&
    conditions.find(
      (condition: unknown) =>
        typeof condition === 'object' && get(condition, 'type') === 'Installed' && get(condition, 'status') === 'True'
    )
  ) {
    return {
      installed: true,
      version: get(clusterExtension, 'status.install.bundle.version') as string | undefined,
    }
  }
  return { installed: false }
}

function isResourceList(response: unknown): response is { items: unknown[] } {
  return typeof response === 'object' && response !== null && 'items' in response && Array.isArray(response.items)
}

export function operatorCheck(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const errorCatcher = catchInternalServerError(res)
  getAuthenticatedToken(req, res)
    .then(() => {
      const serviceAccountToken = getServiceAccountToken()

      const chunks: string[] = []
      req.on('data', (chunk: string) => {
        chunks.push(chunk)
      })
      req.on('end', () => {
        let operatorCheckRequest: unknown
        const data = chunks.join('')
        try {
          operatorCheckRequest = JSON.parse(data) as unknown
        } catch (err) {
          logger.error(err)
        }

        if (isOperatorCheckRequest(operatorCheckRequest)) {
          const operator = operatorCheckRequest.operator
          const clusterApiUrl = process.env.CLUSTER_API_URL
          jsonRequest<unknown>(`${clusterApiUrl}/apis/operators.coreos.com/v1alpha1/subscriptions`, serviceAccountToken)
            .then((subscriptionResponse) => {
              let installed = false
              let version: string | undefined
              if (isResourceList(subscriptionResponse)) {
                ;({ installed, version } = getSubscriptionInstall(subscriptionResponse.items, operator))
              }

              if (installed) {
                const responsePayload: OperatorCheckResponse = { operator, installed, version }
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(responsePayload))
                return
              }

              return jsonRequest<unknown>(
                `${clusterApiUrl}/apis/olm.operatorframework.io/v1/clusterextensions`,
                serviceAccountToken
              )
                .then((clusterExtensionResponse) => {
                  if (isResourceList(clusterExtensionResponse)) {
                    ;({ installed, version } = getClusterExtensionInstall(clusterExtensionResponse.items, operator))
                  }
                  const responsePayload: OperatorCheckResponse = { operator, installed, version }
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(responsePayload))
                })
                .catch((err: unknown) => {
                  // OLMv1 CRD may not exist on older OpenShift versions — treat as not installed
                  logger.trace({
                    msg: 'operatorCheck ClusterExtension query failed; treating as not installed',
                    operator,
                    err,
                  })
                  const responsePayload: OperatorCheckResponse = { operator, installed: false }
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(responsePayload))
                })
            })
            .catch(errorCatcher)
        } else {
          respondBadRequest(req, res)
        }
      })
    })
    .catch(errorCatcher)
}

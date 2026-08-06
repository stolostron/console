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

function hasCondition(item: object, type: string, status: string): boolean {
  const conditions = get(item, 'status.conditions') as unknown[]
  return (
    Array.isArray(conditions) &&
    conditions.some(
      (condition: unknown) =>
        typeof condition === 'object' &&
        condition !== null &&
        get(condition, 'type') === type &&
        get(condition, 'status') === status
    )
  )
}

function getSubscriptionInstall(
  items: unknown[],
  operator: SupportedOperator
): { installed: boolean; version?: string } {
  const subscription = items.find(
    (item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      get(item, 'spec.name') === operator &&
      hasCondition(item, 'CatalogSourcesUnhealthy', 'False')
  ) as object | undefined
  if (subscription) {
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
    (item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      get(item, 'spec.source.catalog.packageName') === operator &&
      hasCondition(item, 'Installed', 'True')
  ) as object | undefined
  if (clusterExtension) {
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

function respondOperatorCheck(res: Http2ServerResponse, payload: OperatorCheckResponse): void {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

async function resolveOperatorInstall(
  operator: SupportedOperator,
  serviceAccountToken: string
): Promise<OperatorCheckResponse> {
  const clusterApiUrl = process.env.CLUSTER_API_URL
  const subscriptionResponse = await jsonRequest<unknown>(
    `${clusterApiUrl}/apis/operators.coreos.com/v1alpha1/subscriptions`,
    serviceAccountToken
  )

  let installed = false
  let version: string | undefined
  if (isResourceList(subscriptionResponse)) {
    ;({ installed, version } = getSubscriptionInstall(subscriptionResponse.items, operator))
  }

  if (installed) {
    return { operator, installed, version }
  }

  try {
    const clusterExtensionResponse = await jsonRequest<unknown>(
      `${clusterApiUrl}/apis/olm.operatorframework.io/v1/clusterextensions`,
      serviceAccountToken
    )
    if (isResourceList(clusterExtensionResponse)) {
      ;({ installed, version } = getClusterExtensionInstall(clusterExtensionResponse.items, operator))
    }
    return { operator, installed, version }
  } catch (err: unknown) {
    // OLMv1 CRD may not exist on older OpenShift versions — treat as not installed
    logger.trace({
      msg: 'operatorCheck ClusterExtension query failed; treating as not installed',
      operator,
      err,
    })
    return { operator, installed: false }
  }
}

function parseOperatorCheckBody(data: string): unknown {
  try {
    return JSON.parse(data) as unknown
  } catch (err) {
    logger.error(err)
    return undefined
  }
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
        const operatorCheckRequest = parseOperatorCheckBody(chunks.join(''))
        if (!isOperatorCheckRequest(operatorCheckRequest)) {
          respondBadRequest(req, res)
          return
        }
        resolveOperatorInstall(operatorCheckRequest.operator, serviceAccountToken)
          .then((payload) => respondOperatorCheck(res, payload))
          .catch(errorCatcher)
      })
    })
    .catch(errorCatcher)
}

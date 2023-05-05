/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import get from 'get-value'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondBadRequest, respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { getServiceAccountToken } from '../lib/serviceAccountToken'

enum SupportedOperator {
  ansible = 'ansible-automation-platform-operator',
  gitOps = 'openshift-gitops-operator',
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

export async function operatorCheck(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const serviceAccountToken = getServiceAccountToken()

    const chunks: string[] = []
    req.on('data', (chunk: string) => {
      chunks.push(chunk)
    })
    req.on('end', async () => {
      let operatorCheckRequest: unknown
      const data = chunks.join()
      try {
        operatorCheckRequest = JSON.parse(data) as unknown
      } catch (err) {
        logger.error(err)
      }

      if (isOperatorCheckRequest(operatorCheckRequest)) {
        try {
          const response = await jsonRequest<unknown>(
            `${process.env.CLUSTER_API_URL}/apis/operators.coreos.com/v1alpha1/subscriptions`,
            serviceAccountToken
          )
          let installed = false
          let version
          const operator = operatorCheckRequest.operator
          if (typeof response === 'object' && 'items' in response && Array.isArray(response.items)) {
            const items = response.items as unknown[]
            const subscription = items.find(
              (item: unknown) => typeof item === 'object' && get(item, 'metadata.name') === operator
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
              installed = true
              version = get(subscription, 'status.installedCSV') as string | undefined
            }
          }

          const responsePayload: OperatorCheckResponse = {
            operator: operatorCheckRequest.operator,
            installed,
            version,
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(responsePayload))
        } catch (err) {
          logger.error(err)
          respondInternalServerError(req, res)
        }
      } else {
        respondBadRequest(req, res)
      }
    })
  }
}

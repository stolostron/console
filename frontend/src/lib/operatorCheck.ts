/* Copyright Contributors to the Open Cluster Management project */

import { SubscriptionOperator } from '../resources'
import { IRequestResult, getBackendUrl, postRequest } from '../resources/utils'
import { useSharedValue } from '../shared-atoms'
import type { SharedValue } from '../shared-atoms'
import { useQuery } from './useQuery'
import { useCallback, useEffect, useMemo } from 'react'

const apiUrl = '/operatorCheck'

export enum SupportedOperator {
  ansible = 'ansible-automation-platform-operator',
  gitOps = 'openshift-gitops-operator',
  acm = 'advanced-cluster-management',
  kubevirt = 'kubevirt-hyperconverged',
}

type OperatorCheckRequest = {
  operator: SupportedOperator
}

export type OperatorCheckResponse = {
  operator: SupportedOperator
  installed: boolean
  version?: string
}

type OperatorCheckResult = {
  operator: SupportedOperator
  installed: boolean
  version?: string
  pending: boolean
}

export function operatorCheck(operator: SupportedOperator): IRequestResult<OperatorCheckResponse> {
  const url = getBackendUrl() + apiUrl
  return postRequest<OperatorCheckRequest, OperatorCheckResponse>(url, { operator })
}

export function useOperatorCheck(
  operator: SupportedOperator,
  selector: SharedValue<SubscriptionOperator[]>
): OperatorCheckResult {
  const subscriptionOperators = useSharedValue(selector)
  const installed = !!subscriptionOperators.length
  const version = installed ? subscriptionOperators[0]?.status?.installedCSV : undefined

  const defaultResponse = useMemo(
    () => ({
      operator,
      installed,
      version,
    }),
    [operator, installed, version]
  )

  const queryFunc = useCallback(() => {
    if (installed) {
      return { promise: Promise.resolve(defaultResponse), abort: () => {} }
    } else {
      return operatorCheck(operator)
    }
  }, [defaultResponse, installed, operator])

  const { data, loading, startPolling, stopPolling } = useQuery(queryFunc, [defaultResponse])

  useEffect(() => {
    startPolling()
    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])
  return { ...(data?.[0] ?? defaultResponse), pending: !installed && loading }
}

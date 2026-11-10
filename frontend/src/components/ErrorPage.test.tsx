/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import {
  getErrorInfo,
  getRawErrorInfo,
  isAccessRestrictedError,
  normalizeAccessRestrictedError,
} from './ErrorPage'
import { ResourceError, ResourceErrorCode } from '../resources/utils'

const t = ((key: string) => key) as unknown as TFunction

describe('ErrorPage access-restricted helpers', () => {
  const accessMessage =
    'You do not have the required permissions to perform this action. Please contact your OpenShift administrator if you need access to this resource.'

  test('isAccessRestrictedError detects ResourceError Forbidden and Unauthorized', () => {
    expect(isAccessRestrictedError(new ResourceError(ResourceErrorCode.Forbidden, 'nope'))).toBe(true)
    expect(isAccessRestrictedError(new ResourceError(ResourceErrorCode.Unauthorized))).toBe(true)
    expect(isAccessRestrictedError(new ResourceError(ResourceErrorCode.InternalServerError))).toBe(false)
  })

  test('isAccessRestrictedError detects forbidden text in plain errors', () => {
    expect(
      isAccessRestrictedError(
        new Error(
          'subscriptions.operators.coreos.com is forbidden: User "GK0X" cannot list resource "subscriptions"'
        )
      )
    ).toBe(true)
    expect(isAccessRestrictedError(new Error('network timeout'))).toBe(false)
  })

  test('normalizeAccessRestrictedError wraps forbidden string errors as Forbidden ResourceError', () => {
    const normalized = normalizeAccessRestrictedError(
      new Error('plans.forklift.konveyor.io is forbidden: User "GK0X" cannot list resource "plans"')
    )
    expect(normalized).toBeInstanceOf(ResourceError)
    expect((normalized as ResourceError).code).toBe(ResourceErrorCode.Forbidden)
  })

  test('getErrorInfo uses Access Restricted copy with error severity for Forbidden', () => {
    const info = getErrorInfo(new ResourceError(ResourceErrorCode.Forbidden, 'raw details'), t)
    expect(info.title).toBe('Access Restricted')
    expect(info.message).toBe(accessMessage)
    expect(info.type).toBe('danger')
  })

  test('getErrorInfo uses Access Restricted copy with error severity for Unauthorized', () => {
    const info = getErrorInfo(new ResourceError(ResourceErrorCode.Unauthorized), t)
    expect(info.title).toBe('Access Restricted')
    expect(info.message).toBe(accessMessage)
    expect(info.type).toBe('danger')
  })

  test('getErrorInfo keeps danger for non-authz failures', () => {
    const info = getErrorInfo(new ResourceError(ResourceErrorCode.InternalServerError), t)
    expect(info.title).toBe('Internal server error')
    expect(info.type).toBe('danger')
  })

  test('getRawErrorInfo maps Forbidden title and message', () => {
    const raw = getRawErrorInfo(new ResourceError(ResourceErrorCode.Forbidden, 'raw'), t)
    expect(raw.title).toBe('Access Restricted')
    expect(raw.message).toBe(accessMessage)
    expect(raw.details).toBe('raw')
  })
})

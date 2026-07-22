/* Copyright Contributors to the Open Cluster Management project */

import {
  getWizardData,
  getWizardAWSAccountIds,
  getWizardAwsBillingAccounts,
  getWizardOIDCConfigs,
  getWizardRegions,
} from './rosa-hcp-api'

const mockFetchRetry = jest.fn()
jest.mock('~/resources/utils', () => ({
  fetchRetry: (...args: unknown[]) => mockFetchRetry(...args),
  getBackendUrl: () => 'https://localhost:4000',
}))

describe('rosa-hcp-api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWizardData', () => {
    test('should call fetchRetry with correct parameters', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })

      await getWizardData('client-id', 'client-secret', '/test-url')

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://localhost:4000/test-url',
          data: {
            service_account_id: 'client-id',
            service_account_secret: 'client-secret',
          },
          retries: 0,
          disableRedirectUnauthorizedLogin: true,
        })
      )
    })

    test('should merge additionalData into the request body', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })

      await getWizardData('client-id', 'client-secret', '/test-url', undefined, { extra_field: 'value' })

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            service_account_id: 'client-id',
            service_account_secret: 'client-secret',
            extra_field: 'value',
          },
        })
      )
    })

    test('should return response data on success', async () => {
      const responseData = { items: [{ id: '123' }] }
      mockFetchRetry.mockResolvedValue({ data: responseData })

      const result = await getWizardData('client-id', 'client-secret', '/test-url')

      expect(result).toEqual(responseData)
    })

    test('should throw error when response contains Error kind', async () => {
      mockFetchRetry.mockResolvedValue({
        data: { kind: 'Error', reason: 'Unauthorized' },
      })

      await expect(getWizardData('client-id', 'client-secret', '/test-url')).rejects.toThrow('Unauthorized')
    })

    test('should throw error when response body contains Error kind', async () => {
      mockFetchRetry.mockResolvedValue({
        data: { body: { kind: 'Error', reason: 'Forbidden' } },
      })

      await expect(getWizardData('client-id', 'client-secret', '/test-url')).rejects.toThrow('Forbidden')
    })

    test('should throw "Unknown error" when Error response has no reason', async () => {
      mockFetchRetry.mockResolvedValue({
        data: { kind: 'Error' },
      })

      await expect(getWizardData('client-id', 'client-secret', '/test-url')).rejects.toThrow('Unknown error')
    })
  })

  describe('getWizardAWSAccountIds', () => {
    test('should call getWizardData with /aws-account-ids path', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })

      await getWizardAWSAccountIds('client-id', 'client-secret')

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://localhost:4000/aws-account-ids',
        })
      )
    })
  })

  describe('getWizardAwsBillingAccounts', () => {
    test('should call getWizardData with /aws-billing-accounts path', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })

      await getWizardAwsBillingAccounts('client-id', 'client-secret')

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://localhost:4000/aws-billing-accounts',
        })
      )
    })
  })

  describe('getWizardOIDCConfigs', () => {
    test('should call getWizardData with /oidc-configs path', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })

      await getWizardOIDCConfigs('client-id', 'client-secret')

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://localhost:4000/oidc-configs',
        })
      )
    })

    test('should pass additionalData to the request body', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })

      await getWizardOIDCConfigs('client-id', 'client-secret', undefined, { aws_account_id: '123456789012' })

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            service_account_id: 'client-id',
            service_account_secret: 'client-secret',
            aws_account_id: '123456789012',
          },
        })
      )
    })

    test('should pass abort signal to the request', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })
      const controller = new AbortController()

      await getWizardOIDCConfigs('client-id', 'client-secret', controller.signal)

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          signal: controller.signal,
        })
      )
    })

    test('should return OIDC config items on success', async () => {
      const oidcResponse = {
        items: [
          {
            id: 'oidc-config-1',
            managed: false,
            installer_role_arn: 'arn:aws:iam::123456789012:role/Installer',
          },
        ],
      }
      mockFetchRetry.mockResolvedValue({ data: oidcResponse })

      const result = await getWizardOIDCConfigs('client-id', 'client-secret')

      expect(result).toEqual(oidcResponse)
    })

    test('should throw error when response contains Error kind', async () => {
      mockFetchRetry.mockResolvedValue({
        data: { kind: 'Error', reason: 'Service account not authorized' },
      })

      await expect(getWizardOIDCConfigs('client-id', 'client-secret')).rejects.toThrow('Service account not authorized')
    })
  })

  describe('getWizardRegions', () => {
    test('should call getWizardData with /regions path', async () => {
      mockFetchRetry.mockResolvedValue({ data: { items: [] } })

      await getWizardRegions('client-id', 'client-secret')

      expect(mockFetchRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://localhost:4000/regions',
        })
      )
    })
  })
})

/* Copyright Contributors to the Open Cluster Management project */

import { ROSA_HCP_WIZARD_QUERY_KEY, rosaWizardKeys } from './queryKeyFactory'

describe('queryKeyFactory', () => {
  test('ROSA_HCP_WIZARD_QUERY_KEY should be defined', () => {
    expect(ROSA_HCP_WIZARD_QUERY_KEY).toBe('rosa-hcp-wizard-query-key')
  })

  test('rosaWizardKeys.all should contain the base query key', () => {
    expect(rosaWizardKeys.all).toEqual([ROSA_HCP_WIZARD_QUERY_KEY])
  })

  test('rosaWizardKeys.awsInfrastructureAccounts should extend the base key with client id', () => {
    const key = rosaWizardKeys.awsInfrastructureAccounts('test-client-id')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', 'aws-account-ids'])
  })

  test('rosaWizardKeys.awsBillingAccounts should extend the base key with client id', () => {
    const key = rosaWizardKeys.awsBillingAccounts('test-client-id')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', 'aws-billing-ids'])
  })

  test('different client ids should produce different keys', () => {
    const key1 = rosaWizardKeys.awsInfrastructureAccounts('client-a')
    const key2 = rosaWizardKeys.awsInfrastructureAccounts('client-b')
    expect(key1).not.toEqual(key2)
  })

  test('rosaWizardKeys.oidcConfigs should extend the base key with client id and aws account id', () => {
    const key = rosaWizardKeys.oidcConfigs('test-client-id', '123456789012')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', '123456789012', 'oidc-configs'])
  })

  test('rosaWizardKeys.regions should extend the base key', () => {
    const key = rosaWizardKeys.regions('test-client-id')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', 'regions'])
  })

  test('each key factory call should return a new array instance', () => {
    const key1 = rosaWizardKeys.awsInfrastructureAccounts('test-client-id')
    const key2 = rosaWizardKeys.awsInfrastructureAccounts('test-client-id')
    expect(key1).toEqual(key2)
    expect(key1).not.toBe(key2)
  })
})

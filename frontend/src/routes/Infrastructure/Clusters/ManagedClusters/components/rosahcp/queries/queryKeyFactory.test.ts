/* Copyright Contributors to the Open Cluster Management project */

import { ROSA_HCP_WIZARD_QUERY_KEY, rosaWizardKeys } from './queryKeyFactory'

describe('queryKeyFactory', () => {
  test('ROSA_HCP_WIZARD_QUERY_KEY should be defined', () => {
    expect(ROSA_HCP_WIZARD_QUERY_KEY).toBe('rosa-hcp-wizard-query-key')
  })

  test('rosaWizardKeys.all should contain the base query key', () => {
    expect(rosaWizardKeys.all).toEqual([ROSA_HCP_WIZARD_QUERY_KEY])
  })

  test('rosaWizardKeys.awsInfrastructureAccounts should extend the base key', () => {
    const key = rosaWizardKeys.awsInfrastructureAccounts()
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'aws-account-ids-fetch'])
  })

  test('rosaWizardKeys.awsBillingAccounts should extend the base key', () => {
    const key = rosaWizardKeys.awsBillingAccounts()
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'aws-billing-ids-fetch'])
  })

  test('each key factory call should return a new array instance', () => {
    const key1 = rosaWizardKeys.awsInfrastructureAccounts()
    const key2 = rosaWizardKeys.awsInfrastructureAccounts()
    expect(key1).toEqual(key2)
    expect(key1).not.toBe(key2)
  })
})

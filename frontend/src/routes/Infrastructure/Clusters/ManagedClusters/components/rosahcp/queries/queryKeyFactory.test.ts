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
  test('rosaWizardKeys.rolesArns should extend the base key with client id and aws account id', () => {
    const key = rosaWizardKeys.rolesArns('test-client-id', '123456789012')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', '123456789012', 'roles-arns'])
  })
  test('rosaWizardKeys.ocmRoleArn should extend the base key with client id and aws account id', () => {
    const key = rosaWizardKeys.ocmRoleArn('test-client-id', '123456789012')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', '123456789012', 'ocm-role-arn'])
  })
  test('rosaWizardKeys.userRoleArn should extend the base key with client id', () => {
    const key = rosaWizardKeys.userRoleArn('test-client-id')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', 'user-role-arn'])
  })

  test('rosaWizardKeys.openshiftVersions should extend the base key with client id', () => {
    const key = rosaWizardKeys.openshiftVersions('test-client-id')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', 'openshift-versions'])
  })

  test('rosaWizardKeys.vpcs should extend the base key with client id, aws account, role arn, and region', () => {
    const key = rosaWizardKeys.vpcs(
      'test-client-id',
      '720424066366',
      'arn:aws:iam::720424066366:role/Installer',
      'us-east-2'
    )
    expect(key).toEqual([
      ROSA_HCP_WIZARD_QUERY_KEY,
      'test-client-id',
      '720424066366',
      'arn:aws:iam::720424066366:role/Installer',
      'us-east-2',
      'vpc',
    ])
  })

  test('rosaWizardKeys.vpcs should include undefined values for optional params', () => {
    const key = rosaWizardKeys.vpcs('test-client-id')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', undefined, undefined, undefined, 'vpc'])
  })

  test('rosaWizardKeys.vpcs should produce different keys for different params', () => {
    const key1 = rosaWizardKeys.vpcs('test-client-id', 'account-a', 'role-a', 'us-east-1')
    const key2 = rosaWizardKeys.vpcs('test-client-id', 'account-b', 'role-b', 'eu-west-1')
    expect(key1).not.toEqual(key2)
  })

  test('rosaWizardKeys.machineTypes should extend the base key with region, role arn, and availability zones', () => {
    const key = rosaWizardKeys.machineTypes('test-client-id', 'us-east-1', 'arn:aws:iam::123:role/Installer', [
      'us-east-1a',
      'us-east-1b',
    ])
    expect(key).toEqual([
      ROSA_HCP_WIZARD_QUERY_KEY,
      'test-client-id',
      'us-east-1',
      'arn:aws:iam::123:role/Installer',
      'us-east-1a,us-east-1b',
      'machine-types',
    ])
  })

  test('rosaWizardKeys.machineTypes should default availability zones to an empty string', () => {
    const key = rosaWizardKeys.machineTypes('test-client-id')
    expect(key).toEqual([ROSA_HCP_WIZARD_QUERY_KEY, 'test-client-id', undefined, undefined, '', 'machine-types'])
  })

  test('each key factory call should return a new array instance', () => {
    const key1 = rosaWizardKeys.awsInfrastructureAccounts('test-client-id')
    const key2 = rosaWizardKeys.awsInfrastructureAccounts('test-client-id')
    expect(key1).toEqual(key2)
    expect(key1).not.toBe(key2)
  })
})

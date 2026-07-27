/* Copyright Contributors to the Open Cluster Management project */
export const ROSA_HCP_WIZARD_QUERY_KEY = 'rosa-hcp-wizard-query-key'

export const rosaWizardKeys = {
  all: [ROSA_HCP_WIZARD_QUERY_KEY],
  awsInfrastructureAccounts: (client_id: string) => [...rosaWizardKeys.all, client_id, 'aws-account-ids'],
  awsBillingAccounts: (client_id: string) => [...rosaWizardKeys.all, client_id, 'aws-billing-ids'],
  oidcConfigs: (client_id: string, aws_account_id?: string) => [
    ...rosaWizardKeys.all,
    client_id,
    aws_account_id,
    'oidc-configs',
  ],
  regions: (client_id: string) => [...rosaWizardKeys.all, client_id, 'regions'],
  rolesArns: (client_id: string, awsAccountId?: string) => [
    ...rosaWizardKeys.all,
    client_id,
    awsAccountId,
    'roles-arns',
  ],
  ocmRoleArn: (client_id: string, awsAccountId?: string) => [
    ...rosaWizardKeys.all,
    client_id,
    awsAccountId,
    'ocm-role-arn',
  ],
  userRoleArn: (client_id: string) => [...rosaWizardKeys.all, client_id, 'user-role-arn'],
  openshiftVersions: (client_id: string) => [...rosaWizardKeys.all, client_id, 'openshift-versions'],
}

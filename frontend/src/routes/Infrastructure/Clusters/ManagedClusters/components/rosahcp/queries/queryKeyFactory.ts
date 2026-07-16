/* Copyright Contributors to the Open Cluster Management project */
export const ROSA_HCP_WIZARD_QUERY_KEY = 'rosa-hcp-wizard-query-key'

export const rosaWizardKeys = {
  all: [ROSA_HCP_WIZARD_QUERY_KEY],
  awsInfrastructureAccounts: (id: string) => [...rosaWizardKeys.all, id, 'aws-account-ids'],
  awsBillingAccounts: (id: string) => [...rosaWizardKeys.all, id, 'aws-billing-ids'],
  oidcConfigs: (id: string, aws_account_id: string) => [...rosaWizardKeys.all, id, aws_account_id, 'oidc-configs'],
}

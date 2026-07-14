/* Copyright Contributors to the Open Cluster Management project */
export const ROSA_HCP_WIZARD_QUERY_KEY = 'rosa-hcp-wizard-query-key'

export const rosaWizardKeys = {
  all: [ROSA_HCP_WIZARD_QUERY_KEY],
  awsInfrastructureAccounts: () => [...rosaWizardKeys.all, 'aws-account-ids-fetch'],
  awsBillingAccounts: () => [...rosaWizardKeys.all, 'aws-billing-ids-fetch'],
}

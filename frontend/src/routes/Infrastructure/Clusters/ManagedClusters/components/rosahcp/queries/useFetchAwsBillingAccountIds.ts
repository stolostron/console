/* Copyright Contributors to the Open Cluster Management project */
import { getWizardAwsBillingAccounts } from '~/lib/rosa-hcp-api'
import { SelectedSecret } from '../constants/types'
import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { rosaWizardKeys } from './queryKeyFactory'

type CloudAccount = {
  cloud_account_id: string
  cloud_provider_id: string
}

type CloudProvider = {
  quota_id: string
  cloud_accounts: CloudAccount[]
}

const getAwsBillingAccountsFromQuota = (items?: CloudProvider[]) => {
  const foundAwsBillingAccounts =
    items
      ?.find((quota) => quota.quota_id === 'cluster|byoc|moa|marketplace')
      ?.cloud_accounts?.filter((account: CloudAccount) => account.cloud_provider_id === 'aws') || []

  const billingAccountDropdown = foundAwsBillingAccounts.map((billingAccount: CloudAccount) => ({
    value: billingAccount.cloud_account_id,
    label: billingAccount.cloud_account_id,
  }))

  return billingAccountDropdown
}

export const useFetchOrganizationQuota = (secret: SelectedSecret) => {
  const { useQuery } = useSharedReactQuery()
  const { isLoading, data, isError, error, isFetching, refetch } = useQuery({
    queryKey: rosaWizardKeys.awsBillingAccounts(),
    queryFn: async ({ signal }) => {
      const organizationQuota = await getWizardAwsBillingAccounts(secret.client_id, secret.client_secret, signal)
      return organizationQuota
    },
    enabled: !!secret,
  })

  const billingAccounts = getAwsBillingAccountsFromQuota(data?.items)

  return { isLoading, data: billingAccounts, isError, error, isFetching, refetch }
}

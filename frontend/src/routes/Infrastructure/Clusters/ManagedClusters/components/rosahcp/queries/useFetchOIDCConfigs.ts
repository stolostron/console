/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useState } from 'react'
import { getWizardOIDCConfigs } from '~/lib/rosa-hcp-api'
import { SelectedSecret } from '../constants/types'
import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { rosaWizardKeys } from './queryKeyFactory'

export const useFetchOIDCConfigs = (selectedSecret: SelectedSecret) => {
  const { useQuery } = useSharedReactQuery()
  const [awsAccountId, setAwsAccountId] = useState<string | undefined>()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: rosaWizardKeys.oidcConfigs(selectedSecret.client_id, awsAccountId ?? ''),
    queryFn: async ({ signal }) => {
      const response = await getWizardOIDCConfigs(selectedSecret.client_id, selectedSecret.client_secret, signal, {
        aws_account_id: awsAccountId,
      })
      return (
        response.items?.map((item) => ({
          value: item.id,
          label: item.id,
          issuer_url: item.issuer_url,
        })) ?? []
      )
    },
    retry: false,
    enabled: !!selectedSecret && !!awsAccountId,
  })
  const fetch = useCallback(async (accountId: string): Promise<void> => {
    setAwsAccountId(accountId)
  }, [])

  return {
    data: data ?? [],
    isFetching: isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Unknown error') : null,
    fetch,
  }
}

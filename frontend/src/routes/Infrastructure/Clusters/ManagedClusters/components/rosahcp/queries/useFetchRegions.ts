/* Copyright Contributors to the Open Cluster Management project */

import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { getWizardRegions } from '~/lib/rosa-hcp-api'
import { DropdownType, SelectedSecret } from '../constants/types'
import { rosaWizardKeys } from './queryKeyFactory'
import { CloudProviderResponse } from '~/resources'

const hcpCloudProvidersAndRegions = (cloudProvidersResponse: CloudProviderResponse): DropdownType[] => {
  const awsProvider = cloudProvidersResponse.items?.find((provider) => provider.id === 'aws')
  if (!awsProvider?.regions) return []
  return awsProvider.regions
    .filter((region) => region.supports_hypershift)
    .map((region) => ({
      value: region.id ?? '',
      label: `${region.id}, ${region.display_name}`,
    }))
}

export const useFetchRegions = (selectedSecret: SelectedSecret) => {
  const { useQuery } = useSharedReactQuery()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: rosaWizardKeys.regions(selectedSecret?.client_id),
    queryFn: async ({ signal }) => {
      const response = await getWizardRegions(selectedSecret.client_id, selectedSecret.client_secret, signal)

      return response
    },
    enabled: !!selectedSecret,
    retry: false,
    select: hcpCloudProvidersAndRegions,
  })

  return {
    data,
    isLoading,
    isError,
    error: isError ? (error instanceof Error ? error.message : 'Unknown error') : null,
    refetch,
  }
}

/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useRef, useState } from 'react'
import { rosaWizardKeys } from './queryKeyFactory'
import { getWizardVPCs } from '~/lib/rosa-hcp-api'
import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { SelectedSecret } from '../constants/types'

interface FetchVPCsArgs {
  account_id: string
  role_arn: string
  region: string
}

export const useFetchVPCs = (selectedSecret: SelectedSecret) => {
  const { useQuery } = useSharedReactQuery()
  const [awsAccountId, setAwsAccountId] = useState<string | undefined>()
  const [installerRoleArn, setInstallerRoleArn] = useState<string | undefined>()
  const [region, setRegion] = useState<string | undefined>()
  const secretRef = useRef(selectedSecret)
  secretRef.current = selectedSecret
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: rosaWizardKeys.vpcs(selectedSecret.client_id, awsAccountId, installerRoleArn, region),
    queryFn: async ({ signal }) => {
      const secret = secretRef.current
      const response = await getWizardVPCs(secret.client_id, secret.client_secret, signal, {
        aws: { account_id: awsAccountId, sts: { role_arn: installerRoleArn } },
        region: { id: region },
      })
      return response.body
    },
    enabled: !!selectedSecret && !!awsAccountId && !!installerRoleArn && !!region,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const fetch = useCallback(
    async (args: FetchVPCsArgs): Promise<void> => {
      if (args.account_id === awsAccountId && args.role_arn === installerRoleArn && args.region === region) {
        refetch()
      } else {
        setAwsAccountId(args.account_id)
        setInstallerRoleArn(args.role_arn)
        setRegion(args.region)
      }
    },
    [awsAccountId, installerRoleArn, region, refetch]
  )

  return {
    data: data?.items ?? [],
    isLoading: isLoading || isFetching,
    error: error ? String(error) : null,
    fetch,
  }
}

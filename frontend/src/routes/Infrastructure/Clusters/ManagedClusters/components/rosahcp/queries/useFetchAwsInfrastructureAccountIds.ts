/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { getWizardAWSAccountIds } from '~/lib/rosa-hcp-api'
import { SelectedSecret } from '../constants/types'
import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { rosaWizardKeys } from './queryKeyFactory'

const extractAWSID = (arn: string): string => {
  // Ex: arn = 'arn:aws:iam::268733382466:role/ManagedOpenShift-OCM-Role-15212158'
  // '268733382466' above ^^ is an example AWS account ID
  const startIndex = arn.indexOf('::') + 2
  const arnSegment = arn.slice(startIndex)
  return arnSegment.slice(0, arnSegment.indexOf(':'))
}

const getAWSIDsFromARNs = (arns: string[]): string[] => {
  const ids = arns.map(extractAWSID)
  return [...new Set(ids)] // convert to Set to remove duplicates, spread to convert back to array
}

export const useFetchAwsAccountIDs = (selectedSecret: SelectedSecret) => {
  const { useQuery } = useSharedReactQuery()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: rosaWizardKeys.awsInfrastructureAccounts(selectedSecret.client_id),
    queryFn: async ({ signal }) => {
      const response = await getWizardAWSAccountIds(selectedSecret.client_id, selectedSecret.client_secret, signal)

      return response
    },
    retry: false,
    enabled: !!selectedSecret,
  })
  const awsAccountIDs = useMemo(() => {
    if (!data?.items) return []
    const stsOCMRoleLabel = data.items.filter((label) => label.key === 'sts_ocm_role')
    const stsOCMRoleValue: string = stsOCMRoleLabel[0]?.value ?? ''
    const arns = stsOCMRoleValue === '' ? [] : stsOCMRoleValue.split(',')
    return getAWSIDsFromARNs(arns)
  }, [data])

  return {
    data: awsAccountIDs,
    isLoading,
    isError,
    error,
    refetch,
  }
}

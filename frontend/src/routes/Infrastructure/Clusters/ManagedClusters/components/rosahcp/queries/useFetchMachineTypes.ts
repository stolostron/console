/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useMemo, useState } from 'react'
import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { getWizardMachineTypes } from '~/lib/rosa-hcp-api'
import { MachineType } from '~/resources'
import { MachineTypesDropdownType, SelectedSecret } from '../constants/types'
import { rosaWizardKeys } from './queryKeyFactory'

export const buildMachineTypeOptions = (machineTypes: MachineType[]): MachineTypesDropdownType[] =>
  (machineTypes ?? [])
    .filter((machineType) => machineType.cloud_provider?.id === 'aws')
    .map((machineType) => ({
      id: machineType.id,
      value: machineType.id,
      label: machineType.id,
      description: machineType.name ?? machineType.generic_name ?? '',
    }))

export type MachineTypesFetchArgs = {
  region: string
  role_arn: string
  availability_zones: string[]
}

export const useFetchMachineTypes = (selectedSecret: SelectedSecret) => {
  const { useQuery } = useSharedReactQuery()
  const [region, setRegion] = useState<string | undefined>()
  const [roleArn, setRoleArn] = useState<string | undefined>()
  const [availabilityZones, setAvailabilityZones] = useState<string[] | undefined>()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: rosaWizardKeys.machineTypes(selectedSecret?.client_id, region, roleArn, availabilityZones),
    queryFn: async ({ signal }) => {
      const response = await getWizardMachineTypes(selectedSecret.client_id, selectedSecret.client_secret, signal, {
        region: region as string,
        role_arn: roleArn as string,
        availability_zones: availabilityZones ?? [],
      })
      return response
    },
    enabled: !!selectedSecret && !!region && !!roleArn && !!availabilityZones?.length,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })

  const fetch = useCallback(async (queryParams: MachineTypesFetchArgs): Promise<void> => {
    setRegion(queryParams.region)
    setRoleArn(queryParams.role_arn)
    setAvailabilityZones(queryParams.availability_zones)
  }, [])

  const machineTypeOptions = useMemo(() => buildMachineTypeOptions(data?.body.items ?? []), [data])

  return {
    data: machineTypeOptions,
    isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Unknown error') : null,
    fetch,
  }
}

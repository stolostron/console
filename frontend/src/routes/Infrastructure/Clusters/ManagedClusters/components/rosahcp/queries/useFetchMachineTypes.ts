/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useState } from 'react'
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
  const [machineTypesQueryParams, setMachineTypesQueryParams] = useState<MachineTypesFetchArgs | undefined>()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: rosaWizardKeys.machineTypes(
      selectedSecret?.client_id,
      machineTypesQueryParams?.region,
      machineTypesQueryParams?.role_arn,
      machineTypesQueryParams?.availability_zones
    ),
    queryFn: async ({ signal }) => {
      const response = await getWizardMachineTypes(selectedSecret.client_id, selectedSecret.client_secret, signal, {
        region: machineTypesQueryParams?.region as string,
        role_arn: machineTypesQueryParams?.role_arn as string,
        availability_zones: machineTypesQueryParams?.availability_zones ?? [],
      })
      return response.items ?? []
    },
    enabled:
      !!selectedSecret &&
      !!machineTypesQueryParams?.region &&
      !!machineTypesQueryParams?.role_arn &&
      !!machineTypesQueryParams?.availability_zones?.length,
    retry: false,
    select: buildMachineTypeOptions,
  })

  const fetch = useCallback(async (queryParams: MachineTypesFetchArgs): Promise<void> => {
    setMachineTypesQueryParams(queryParams)
  }, [])

  return {
    data: data ?? [],
    isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Unknown error') : null,
    fetch,
  }
}

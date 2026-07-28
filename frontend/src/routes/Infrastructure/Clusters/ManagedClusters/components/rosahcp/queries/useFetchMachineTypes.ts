/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useState } from 'react'
import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { getWizardMachineTypes } from '~/lib/rosa-hcp-api'
import { MachineTypesResponse } from '~/resources'
import { MachineTypesDropdownType, SelectedSecret } from '../constants/types'
import { rosaWizardKeys } from './queryKeyFactory'

export const buildMachineTypeOptions = (response: MachineTypesResponse): MachineTypesDropdownType[] =>
  (response.items ?? []).map((machineType) => ({
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
  const [args, setArgs] = useState<MachineTypesFetchArgs | undefined>()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: rosaWizardKeys.machineTypes(
      selectedSecret?.client_id,
      args?.region,
      args?.role_arn,
      args?.availability_zones
    ),
    queryFn: async ({ signal }) => {
      const response = await getWizardMachineTypes(selectedSecret.client_id, selectedSecret.client_secret, signal, {
        region: args?.region as string,
        role_arn: args?.role_arn as string,
        availability_zones: args?.availability_zones ?? [],
      })
      return buildMachineTypeOptions(response)
    },
    enabled: !!selectedSecret && !!args?.region && !!args?.role_arn,
    retry: false,
  })

  const fetch = useCallback(async (fetchArgs: MachineTypesFetchArgs): Promise<void> => {
    setArgs(fetchArgs)
  }, [])

  return {
    data: data ?? [],
    isFetching: isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Unknown error') : null,
    fetch,
  }
}

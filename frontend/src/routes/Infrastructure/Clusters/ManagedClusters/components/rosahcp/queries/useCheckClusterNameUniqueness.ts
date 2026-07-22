/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useState } from 'react'
import { getWizardClusterNameUniqueness } from '~/lib/rosa-hcp-api'
import type { SelectedSecret } from '../constants/types'

interface ValidationResource {
  error: string | null
  isFetching: boolean
}

type CheckClusterNameUniqueness = (name: string, region?: string) => Promise<string | null>

export function useClusterNameUniquenessCheck(secret: SelectedSecret): {
  clusterNameValidation: ValidationResource
  checkClusterNameUniqueness: CheckClusterNameUniqueness
} {
  const [clusterNameValidation, setClusterNameValidation] = useState<ValidationResource>({
    error: null,
    isFetching: false,
  })
  const checkClusterNameUniqueness: CheckClusterNameUniqueness = useCallback(
    async (name, region) => {
      setClusterNameValidation({ error: null, isFetching: true })
      try {
        const response = await getWizardClusterNameUniqueness(secret.client_id, secret.client_secret, undefined, {
          cluster_name: name,
          region,
        })
        const isTaken = response.total > 0
        const error = isTaken ? `Cluster name "${name}" already exists. Choose a different name.` : null
        setClusterNameValidation({ error, isFetching: false })
        return error
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check cluster name availability'
        setClusterNameValidation({ error: message, isFetching: false })
        throw err
      }
    },
    [secret.client_id, secret.client_secret]
  )
  return { clusterNameValidation, checkClusterNameUniqueness }
}

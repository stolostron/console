/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useSharedValue, useSharedAtoms } from '~/shared-atoms'

export const useCredentialsSecrets = () => {
  const { secretsState } = useSharedAtoms()
  const secrets = useSharedValue(secretsState)
  const credentialsSecrets = useMemo(
    () =>
      secrets.filter(
        (secret) =>
          secret?.metadata?.labels?.['cluster.open-cluster-management.io/credentials'] !== undefined &&
          secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'rhocm'
      ),
    [secrets]
  )

  return credentialsSecrets
}

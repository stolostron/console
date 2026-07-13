/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'

export const useCredentialsSecrets = () => {
  const { secretsState } = useSharedAtoms()
  const secrets = useRecoilValue(secretsState)
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

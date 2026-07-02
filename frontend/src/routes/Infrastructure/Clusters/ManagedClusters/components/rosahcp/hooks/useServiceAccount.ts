import { useMemo } from 'react'
import { Secret } from '~/resources'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'

export function useRhocmSecrets(): Secret[] {
  const { secretsState } = useSharedAtoms()
  const secrets = useRecoilValue(secretsState)
  return useMemo(
    () =>
      secrets.filter(
        (secret: any) =>
          secret?.metadata?.labels?.['cluster.open-cluster-management.io/credentials'] !== undefined &&
          secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'rhocm'
      ),
    [secrets]
  )
}

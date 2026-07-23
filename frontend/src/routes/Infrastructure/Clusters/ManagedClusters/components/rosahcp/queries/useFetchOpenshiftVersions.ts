/* Copyright Contributors to the Open Cluster Management project */

import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { getWizardVersions } from '~/lib/rosa-hcp-api'
import { rosaWizardKeys } from './queryKeyFactory'
import { DropdownType, OpenshiftVersion, SelectedSecret } from '../constants/types'

export const versionRegEx = /(?<major>\d+).(?<minor>\d+).(?<revision>\d+)(?:-(rc|fc).(?<patch>\d+))?/

export const versionComparator = (v1: string, v2: string): number => {
  const g1 = versionRegEx.exec(v1)?.groups
  const g2 = versionRegEx.exec(v2)?.groups
  if (g1 && g2) {
    if (g1.major !== g2.major) {
      return parseInt(g1.major, 10) > parseInt(g2.major, 10) ? 1 : -1
    }
    if (g1.minor !== g2.minor) {
      return parseInt(g1.minor, 10) > parseInt(g2.minor, 10) ? 1 : -1
    }
    if (g1.revision !== g2.revision) {
      return parseInt(g1.revision, 10) > parseInt(g2.revision, 10) ? 1 : -1
    }
    if (g1.patch !== g2.patch) {
      // e.g. 4.6.0 is later than 4.6.0-rc.4
      if (g1.patch === undefined) {
        return 1
      }
      if (g2.patch === undefined) {
        return -1
      }
      return parseInt(g1.patch, 10) > parseInt(g2.patch, 10) ? 1 : -1
    }
  }
  return 0
}

const filterAndSortHCPVersions = (versions: OpenshiftVersion[]): any[] => {
  const now = Date.now()

  return versions
    .filter((version) => version)
    .filter((version) => !version.end_of_life_timestamp || new Date(version.end_of_life_timestamp).getTime() > now)
    .filter((version) => version.hosted_control_plane_enabled)
    .filter((version) => version.rosa_enabled)
    .filter((version) => version.channel_group === 'stable')
    .sort((a, b) => versionComparator(b.raw_id!, a.raw_id!))
}

const getVersionBranch = (versionStr: string): string | null => {
  const groups = versionRegEx.exec(versionStr)?.groups
  return groups ? `${groups.major}.${groups.minor}` : null
}

const transformToVersionsData = (versions: OpenshiftVersion[]): any => {
  const sorted = filterAndSortHCPVersions(versions)

  const defaultVersion = sorted.find((version) => version.hosted_control_plane_default || version.default)

  const latestVersion = sorted[0]

  // Only 3 4.Y versions are needed. Latest and two before with all corresponding z versions
  const allowedBranches = new Set<string>()
  for (const version of sorted) {
    const val = version.raw_id ?? version.id ?? ''
    const branch = getVersionBranch(val)

    if (branch) {
      allowedBranches.add(branch)
      if (allowedBranches.size === 3) break
    }
  }

  const releases: DropdownType[] = sorted
    .filter((version) => {
      const val = version.raw_id ?? version.id ?? ''
      const branch = getVersionBranch(val)
      return branch ? allowedBranches.has(branch) : false
    })
    .map((version) => {
      const val = version.raw_id ?? version.id ?? ''
      return { label: val, value: val }
    })

  return {
    default: defaultVersion ? { label: defaultVersion.raw_id ?? '', value: defaultVersion.raw_id ?? '' } : undefined,
    latest: latestVersion ? { label: latestVersion.raw_id ?? '', value: latestVersion.raw_id ?? '' } : undefined,
    releases,
  }
}

export const useFetchHCPVersions = (secrets: SelectedSecret) => {
  const { client_id, client_secret } = secrets
  const { useQuery } = useSharedReactQuery()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: rosaWizardKeys.openshiftVersions(client_id),
    queryFn: async ({signal}) => {
      const response = await getWizardVersions(client_id, client_secret, signal)
      return response.items ?? []
    },
    select: transformToVersionsData,
  })

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}

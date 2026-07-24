/* Copyright Contributors to the Open Cluster Management project */

import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { getWizardVersions } from '~/lib/rosa-hcp-api'
import { rosaWizardKeys } from './queryKeyFactory'
import type { DropdownType, OpenshiftVersion, SelectedSecret } from '../constants/types'

export const versionRegEx = /(?<major>\d+).(?<minor>\d+).(?<revision>\d+)(?:-(rc|fc).(?<patch>\d+))?/

const compareSegment = (a: string | undefined, b: string | undefined): number => {
  if (a === b) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  return Number.parseInt(a, 10) > Number.parseInt(b, 10) ? 1 : -1
}
export const versionComparator = (v1: string, v2: string): number => {
  const g1 = versionRegEx.exec(v1)?.groups
  const g2 = versionRegEx.exec(v2)?.groups
  if (!g1 || !g2) return 0
  const segments: Array<'major' | 'minor' | 'revision'> = ['major', 'minor', 'revision']
  for (const segment of segments) {
    const result = compareSegment(g1[segment], g2[segment])
    if (result !== 0) return result
  }
  return compareSegment(g1.patch, g2.patch)
}

const filterAndSortHCPVersions = (versions: OpenshiftVersion[]) => {
  const now = Date.now()

  return versions
    .filter(Boolean)
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

const transformToVersionsData = (versions: OpenshiftVersion[]) => {
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
    default: defaultVersion ? { label: defaultVersion.raw_id ?? defaultVersion.id ?? '', value: defaultVersion.raw_id ?? defaultVersion.id ?? '' } : undefined,
    latest: latestVersion ? { label: latestVersion.raw_id ?? latestVersion.id ?? '', value: latestVersion.raw_id ?? latestVersion.id ?? '' } : undefined,
    releases,
  }
}

export const useFetchHCPVersions = (secrets: SelectedSecret) => {
  const { client_id, client_secret } = secrets
  const { useQuery } = useSharedReactQuery()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: rosaWizardKeys.openshiftVersions(client_id),
    queryFn: async ({ signal }) => {
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

/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { Group, GroupKind, User, UserApiVersion, UserKind } from '../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { compareStrings } from '../../../ui-components'
import { IdentityItem } from './IdentityTableHelper'

function identityFromMra(mra: MulticlusterRoleAssignment): IdentityItem {
  const { kind, name } = mra.spec.subject
  const base = {
    apiVersion: UserApiVersion,
    metadata: {
      name,
      uid: name,
      creationTimestamp: mra.metadata.creationTimestamp,
    },
  }
  return kind === GroupKind ? ({ ...base, kind: GroupKind, users: [] } as Group) : ({ ...base, kind: UserKind } as User)
}

function identitiesFromMras(
  mras: MulticlusterRoleAssignment[],
  targetKind: string,
  existingNames: Set<string>
): IdentityItem[] {
  return mras.reduce<{ seen: Set<string>; items: IdentityItem[] }>(
    (acc, mra) => {
      const { kind, name } = mra.spec.subject
      if (kind !== targetKind || !name || existingNames.has(name) || acc.seen.has(name)) return acc
      acc.seen.add(name)
      acc.items.push(identityFromMra(mra))
      return acc
    },
    { seen: new Set(), items: [] }
  ).items
}

export function usersFromMulticlusterRoleAssignments(
  mras: MulticlusterRoleAssignment[],
  existingNames: Set<string>
): User[] {
  return identitiesFromMras(mras, UserKind, existingNames) as User[]
}

export function groupsFromMulticlusterRoleAssignments(
  mras: MulticlusterRoleAssignment[],
  existingNames: Set<string>
): Group[] {
  return identitiesFromMras(mras, GroupKind, existingNames) as Group[]
}

export function useMergedUsers(): User[] {
  const { usersState, multiclusterRoleAssignmentState } = useSharedAtoms()
  const rbacUsers = useRecoilValue(usersState)
  const mras = useRecoilValue(multiclusterRoleAssignmentState)
  return useMemo(() => {
    const existingNames = new Set(rbacUsers?.map((u) => u.metadata.name).filter(Boolean) as string[])
    const mraUsers = usersFromMulticlusterRoleAssignments(mras ?? [], existingNames)
    return [...(rbacUsers ?? []), ...mraUsers].sort((a, b) =>
      compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')
    )
  }, [rbacUsers, mras])
}

export function useMergedGroups(): Group[] {
  const { groupsState, multiclusterRoleAssignmentState } = useSharedAtoms()
  const groupsData = useRecoilValue(groupsState)
  const mras = useRecoilValue(multiclusterRoleAssignmentState)
  return useMemo(() => {
    const existingNames = new Set(groupsData?.map((g) => g.metadata.name).filter(Boolean) as string[])
    const mraGroups = groupsFromMulticlusterRoleAssignments(mras ?? [], existingNames)
    return [...(groupsData ?? []), ...mraGroups].sort((a, b) =>
      compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')
    )
  }, [groupsData, mras])
}

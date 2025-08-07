/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { RoleAssignmentIds } from '../model/role-assignment-ids'
import { RoleAssignmentHookType, SelectOption, useRoleAssignment } from './RoleAssignmentHook'

type RoleAssignmentFormDataType = {
  subject: {
    kind: 'user' | 'group' | 'serviceAccount'
    users: string[]
    groups: string[]
    serviceAccounts: string[]
  }
  scope: {
    kind: 'all' | 'specific'
  }
  roles: string[]
}

const useRoleAssignmentFormData = (preselected?: RoleAssignmentIds) => {
  const { roleAssignment } = useRoleAssignment()

  const [roleAssignmentFormData, setRoleAssignmentFormData] = useState<RoleAssignmentFormDataType>({
    subject: { kind: 'user', users: [], groups: [], serviceAccounts: [] },
    scope: {
      kind: 'all',
    },
    roles: [],
  })

  const onChangeSubjectKind = (subjectKind: string) =>
    setRoleAssignmentFormData({
      ...roleAssignmentFormData,
      subject: {
        ...roleAssignmentFormData.subject,
        kind: subjectKind as RoleAssignmentFormDataType['subject']['kind'],
      },
    })

  const onChangeUsers = useCallback(
    (users: string[]) =>
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        subject: {
          ...roleAssignmentFormData.subject,
          users,
        },
      }),
    [roleAssignmentFormData]
  )

  const onChangeGroups = useCallback(
    (groups: string[]) =>
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        subject: {
          ...roleAssignmentFormData.subject,
          groups,
        },
      }),
    [roleAssignmentFormData]
  )

  const onChangeServiceAccounts = useCallback(
    (serviceAccounts: string[]) =>
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        subject: {
          ...roleAssignmentFormData.subject,
          serviceAccounts,
        },
      }),
    [roleAssignmentFormData]
  )

  const onChangeScopeKind = (scope: string) =>
    setRoleAssignmentFormData({
      ...roleAssignmentFormData,
      scope: {
        ...roleAssignmentFormData.scope,
        kind: scope as RoleAssignmentFormDataType['scope']['kind'],
      },
    })

  const onChangeRoles = useCallback(
    (roles: string[]) => {
      console.log('KIKE onChangeRoles', roles)
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        roles,
      })
    },
    [roleAssignmentFormData]
  )

  // preselected treatments
  const treatPreselected = useCallback(
    (
      preselectedFieldName: string,
      roleAssignmentFieldName: string,
      roleAssignment: RoleAssignmentHookType,
      onChangeCallback: (value: any) => void,
      preselected?: RoleAssignmentIds
    ) => {
      if (get(preselected, preselectedFieldName)?.length) {
        const values: string[] = get(roleAssignment, roleAssignmentFieldName)
          .filter((e: SelectOption) => e.value && e.id && get(preselected, preselectedFieldName)?.includes(e.id))
          .map((e: SelectOption) => e.value)
        onChangeCallback(values)
      }
    },
    []
  )

  useEffect(
    () => treatPreselected('userIds', 'users', roleAssignment, onChangeUsers, preselected),
    [roleAssignment.users, preselected, onChangeUsers, treatPreselected, roleAssignment]
  )

  useEffect(
    () => treatPreselected('groupIds', 'groups', roleAssignment, onChangeGroups, preselected),
    [roleAssignment.groups, preselected, onChangeGroups, treatPreselected, roleAssignment]
  )

  useEffect(
    () =>
      treatPreselected('serviceAccountIds', 'serviceAccounts', roleAssignment, onChangeServiceAccounts, preselected),
    [roleAssignment.serviceAccounts, preselected, onChangeServiceAccounts, treatPreselected, roleAssignment]
  )

  useEffect(
    () => treatPreselected('roleIds', 'roles', roleAssignment, onChangeRoles, preselected),
    [roleAssignment.roles, preselected, onChangeRoles, treatPreselected, roleAssignment]
  )

  return {
    roleAssignmentFormData,
    onChangeSubjectKind,
    onChangeUsers,
    onChangeGroups,
    onChangeServiceAccounts,
    onChangeScopeKind,
    onChangeRoles,
  }
}

export { useRoleAssignmentFormData }

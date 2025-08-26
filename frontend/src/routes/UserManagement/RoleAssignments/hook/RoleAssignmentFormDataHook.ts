/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { RoleAssignmentPreselected } from '../model/role-assignment-preselected'
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

/**
 * custom hook for handling everything related with the form data itself
 * @param preselected: RoleAssignmentPreselected
 * @returns either the form data and different onChange functions
 */
const useRoleAssignmentFormData = (preselected?: RoleAssignmentPreselected) => {
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
    (roles: string[]) =>
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        roles,
      }),
    [roleAssignmentFormData]
  )

  // preselected treatments
  const setValuesBasedOnPreselected = useCallback(
    (
      preselectedFieldName: string,
      roleAssignment: RoleAssignmentHookType,
      onChangeCallback: (value: any) => void,
      preselected?: RoleAssignmentPreselected
    ) => {
      if (get(preselected, preselectedFieldName)?.length) {
        const values: string[] = get(roleAssignment, preselectedFieldName)
          .filter((e: SelectOption) => e.value && e.id && get(preselected, preselectedFieldName)?.includes(e.id))
          .map((e: SelectOption) => e.value)
        onChangeCallback(values)
      }
    },
    []
  )

  useEffect(
    () => setValuesBasedOnPreselected('users', roleAssignment, onChangeUsers, preselected),
    [roleAssignment.users, preselected, onChangeUsers, setValuesBasedOnPreselected, roleAssignment]
  )

  useEffect(
    () => setValuesBasedOnPreselected('groups', roleAssignment, onChangeGroups, preselected),
    [roleAssignment.groups, preselected, onChangeGroups, setValuesBasedOnPreselected, roleAssignment]
  )

  useEffect(
    () => setValuesBasedOnPreselected('roles', roleAssignment, onChangeRoles, preselected),
    [roleAssignment.roles, preselected, onChangeRoles, setValuesBasedOnPreselected, roleAssignment]
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

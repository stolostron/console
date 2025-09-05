/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { RoleAssignmentPreselected } from '../model/role-assignment-preselected'
import { useRoleAssignment } from './RoleAssignmentHook'

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
    (preselectedFieldName: string, onChangeCallback: (value: any) => void, preselected?: RoleAssignmentPreselected) => {
      if (get(preselected, preselectedFieldName)?.length) {
        const values: string[] = get(preselected, preselectedFieldName)
        onChangeCallback(values)
      }
    },
    []
  )

  useEffect(
    () => setValuesBasedOnPreselected('users', onChangeUsers, preselected),
    [roleAssignment.users, preselected, onChangeUsers, setValuesBasedOnPreselected]
  )

  useEffect(
    () => setValuesBasedOnPreselected('groups', onChangeGroups, preselected),
    [roleAssignment.groups, preselected, onChangeGroups, setValuesBasedOnPreselected]
  )

  useEffect(
    () => setValuesBasedOnPreselected('roles', onChangeRoles, preselected),
    [roleAssignment.roles, preselected, onChangeRoles, setValuesBasedOnPreselected]
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

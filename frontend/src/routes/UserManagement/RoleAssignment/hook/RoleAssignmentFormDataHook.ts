/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { RoleAssignmentPreselected } from '../model/role-assignment-preselected'
import { useRoleAssignmentData } from './RoleAssignmentDataHook'
import { GroupKind, GroupKindType, ServiceAccountKindType, UserKind, UserKindType } from '../../../../resources'

type RoleAssignmentFormDataType = {
  subject: {
    kind: UserKindType | GroupKindType | ServiceAccountKindType
    user?: string
    group?: string
  }
  scope: {
    kind: 'all' | 'specific'
    clusterNames?: string[]
    namespaces?: string[]
  }
  roles: string[]
}

/**
 * custom hook for handling everything related with the form data itself
 * @param preselected: RoleAssignmentPreselected
 * @returns either the form data and different onChange functions
 */
const useRoleAssignmentFormData = (preselected?: RoleAssignmentPreselected) => {
  const { roleAssignmentData } = useRoleAssignmentData()

  const [roleAssignmentFormData, setRoleAssignmentFormData] = useState<RoleAssignmentFormDataType>({
    subject: { kind: UserKind },
    scope: {
      kind: 'all',
      clusterNames: [],
    },
    roles: [],
  })

  const onChangeSubjectKind = useCallback(
    (subjectKind: string) =>
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        subject: {
          ...roleAssignmentFormData.subject,
          kind: subjectKind as RoleAssignmentFormDataType['subject']['kind'],
        },
      }),
    [roleAssignmentFormData]
  )

  const onChangeUserValue = useCallback(
    (user?: string) =>
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        subject: {
          ...roleAssignmentFormData.subject,
          user,
        },
      }),
    [roleAssignmentFormData]
  )

  const onChangeGroupValue = useCallback(
    (group?: string) =>
      setRoleAssignmentFormData({
        ...roleAssignmentFormData,
        subject: {
          ...roleAssignmentFormData.subject,
          group,
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

  const onChangeScopeValues = (values: string[]) => {
    setRoleAssignmentFormData({
      ...roleAssignmentFormData,
      scope: {
        ...roleAssignmentFormData.scope,
        clusterNames: values,
      },
    })
  }

  const onChangeScopeNamespaces = (namespaces: string[]) =>
    setRoleAssignmentFormData({
      ...roleAssignmentFormData,
      scope: {
        ...roleAssignmentFormData.scope,
        namespaces,
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

  // preselected
  useEffect(() => {
    const subject = get(preselected, 'subject')
    if (subject) {
      onChangeSubjectKind(subject.kind)
      switch (subject.kind) {
        case UserKind:
          onChangeUserValue(subject.value)
          break
        case GroupKind:
          onChangeGroupValue(subject.value)
          break
      }
    }
  }, [
    roleAssignmentData.groups,
    roleAssignmentData.users,
    preselected,
    onChangeUserValue,
    onChangeSubjectKind,
    onChangeGroupValue,
  ])

  useEffect(() => {
    const roles = get(preselected, 'roles')
    if (roles?.length) {
      onChangeRoles(roles)
    }
  }, [roleAssignmentData.roles, preselected, onChangeRoles])

  return {
    roleAssignmentFormData,
    onChangeSubjectKind,
    onChangeUserValue,
    onChangeGroupValue,
    onChangeScopeKind,
    onChangeScopeValues,
    onChangeScopeNamespaces,
    onChangeRoles,
  }
}

export { useRoleAssignmentFormData }
export type { RoleAssignmentFormDataType }

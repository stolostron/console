/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { RoleAssignmentPreselected } from '../model/role-assignment-preselected'
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
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        subject: {
          ...prevData.subject,
          kind: subjectKind as RoleAssignmentFormDataType['subject']['kind'],
        },
      })),
    []
  )

  const onChangeUserValue = useCallback(
    (user?: string) =>
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        subject: {
          ...prevData.subject,
          user,
        },
      })),
    []
  )

  const onChangeGroupValue = useCallback(
    (group?: string) =>
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        subject: {
          ...prevData.subject,
          group,
        },
      })),
    []
  )

  const onChangeScopeKind = useCallback(
    (scope: string) =>
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        scope: {
          ...prevData.scope,
          kind: scope as RoleAssignmentFormDataType['scope']['kind'],
        },
      })),
    []
  )

  const onChangeScopeValues = useCallback((values: string[]) => {
    setRoleAssignmentFormData((prevData) => ({
      ...prevData,
      scope: {
        ...prevData.scope,
        clusterNames: values,
      },
    }))
  }, [])

  const onChangeScopeNamespaces = useCallback(
    (namespaces: string[]) =>
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        scope: {
          ...prevData.scope,
          namespaces,
        },
      })),
    []
  )

  const onChangeRoles = useCallback(
    (roles: string[]) =>
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        roles,
      })),
    []
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
  }, [preselected, onChangeUserValue, onChangeSubjectKind, onChangeGroupValue])

  useEffect(() => {
    const roles = get(preselected, 'roles')
    if (roles?.length) {
      onChangeRoles(roles)
    }
  }, [preselected, onChangeRoles])

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

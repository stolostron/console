/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { RoleAssignmentPreselected } from '../model/role-assignment-preselected'
import { GroupKind, GroupKindType, ServiceAccountKindType, UserKind, UserKindType } from '../../../../resources'
import { RoleAssignmentHookType } from './RoleAssignmentDataHook'

type RoleAssignmentFormDataType = {
  subject: {
    kind: UserKindType | GroupKindType | ServiceAccountKindType
    user?: string[]
    group?: string[]
  }
  scope: {
    kind: 'all' | 'specific'
    placements?: string[]
    namespaces?: string[]
  }
  roles: string[]
}

/**
 * custom hook for handling everything related with the form data itself
 * @param preselected: RoleAssignmentPreselected
 * @param roleAssignmentData: RoleAssignmentHookType for accessing all cluster names
 * @returns either the form data and different onChange functions
 */
const useRoleAssignmentFormData = (
  preselected?: RoleAssignmentPreselected,
  roleAssignmentData?: RoleAssignmentHookType
) => {
  const [roleAssignmentFormData, setRoleAssignmentFormData] = useState<RoleAssignmentFormDataType>({
    subject: { kind: UserKind },
    scope: {
      kind: 'all',
      placements: [],
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
          user: subjectKind === UserKind ? prevData.subject.user : undefined,
          group: subjectKind === GroupKind ? prevData.subject.group : undefined,
        },
      })),
    []
  )

  const onChangeUserValue = useCallback(
    (user?: string[]) =>
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
    (group?: string[]) =>
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
    (scope: string) => {
      const scopeKind = scope as RoleAssignmentFormDataType['scope']['kind']
      if (roleAssignmentFormData.scope.kind !== scopeKind) {
        setRoleAssignmentFormData((prevData) => ({
          ...prevData,
          scope: {
            kind: scopeKind,
            placements: scopeKind === 'all' ? roleAssignmentData?.allPlacements || [] : [],
            namespaces: scopeKind === 'all' ? undefined : [],
          },
        }))
      }
    },
    [roleAssignmentData?.allPlacements, roleAssignmentFormData.scope.kind]
  )

  const onChangeScopeValues = useCallback((values: string[]) => {
    setRoleAssignmentFormData((prevData) => ({
      ...prevData,
      scope: {
        ...prevData.scope,
        placements: values,
      },
    }))
  }, [])

  const onChangeScopeNamespaces = useCallback(
    (namespaces: string[] | undefined) =>
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
          onChangeUserValue(subject.value ? [subject.value] : undefined)
          break
        case GroupKind:
          onChangeGroupValue(subject.value ? [subject.value] : undefined)
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

  useEffect(() => {
    const placements = get(preselected, 'placements')
    if (placements?.length) {
      onChangeScopeKind('specific')
      onChangeScopeValues(placements)
    }
  }, [preselected, onChangeScopeKind, onChangeScopeValues])

  useEffect(() => {
    if (roleAssignmentFormData.scope.kind === 'all' && roleAssignmentData?.allPlacements?.length) {
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        scope: {
          ...prevData.scope,
          placements: roleAssignmentData.allPlacements,
          namespaces: undefined,
        },
      }))
    }
  }, [roleAssignmentData?.allPlacements, roleAssignmentFormData.scope.kind])

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

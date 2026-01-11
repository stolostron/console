/* Copyright Contributors to the Open Cluster Management project */
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
    clusterNames?: string[]
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
            clusterNames: scopeKind === 'all' ? roleAssignmentData?.allClusterNames || [] : [],
            namespaces: scopeKind === 'all' ? undefined : [],
          },
        }))
      }
    },
    [roleAssignmentData?.allClusterNames, roleAssignmentFormData.scope.kind]
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
    const subject = preselected?.subject
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
    const roles = preselected?.roles
    if (roles?.length) {
      onChangeRoles(roles)
    }
  }, [preselected, onChangeRoles])

  useEffect(() => {
    const clusterNames = preselected?.clusterNames
    if (clusterNames?.length) {
      onChangeScopeKind('specific')
      onChangeScopeValues(clusterNames)
    }
  }, [preselected, onChangeScopeKind, onChangeScopeValues])

  useEffect(() => {
    if (roleAssignmentFormData.scope.kind === 'all' && roleAssignmentData?.allClusterNames?.length) {
      setRoleAssignmentFormData((prevData) => ({
        ...prevData,
        scope: {
          ...prevData.scope,
          clusterNames: roleAssignmentData.allClusterNames,
          namespaces: undefined,
        },
      }))
    }
  }, [roleAssignmentData?.allClusterNames, roleAssignmentFormData.scope.kind])

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

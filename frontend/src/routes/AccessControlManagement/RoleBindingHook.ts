/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useState } from 'react'
import { ClusterRoleBinding, RoleBinding } from '../../resources/access-control'

export type RoleBindingHookType = {
  subjectKind: 'User' | 'Group'
  subjectNames: string[]
  users: string[]
  groups: string[]
  roleNames: string[]
  namespaces: string[]
  wasPreFilled: boolean
}

const useRoleBinding = () => {
  const [roleBinding, setRoleBinding] = useState<RoleBindingHookType>({
    subjectKind: 'User',
    subjectNames: [],
    users: [],
    groups: [],
    roleNames: [],
    namespaces: [],
    wasPreFilled: false,
  })
  const [isValid, setIsValid] = useState<boolean>(false)

  useEffect(
    () => setIsValid(roleBinding.roleNames.length > 0 && roleBinding.subjectNames.length > 0),
    [roleBinding.roleNames, roleBinding.subjectNames]
  )

  const setSubjectKind = (value: string) => {
    const newSubjectKind = value.toLowerCase() === 'group' ? 'Group' : 'User'

    setRoleBinding((rb) => {
      const savedUsers = rb.subjectKind === 'User' ? rb.subjectNames : rb.users
      const savedGroups = rb.subjectKind === 'Group' ? rb.subjectNames : rb.groups
      const newSubjectNames = newSubjectKind === 'User' ? savedUsers : savedGroups

      return {
        ...rb,
        subjectKind: newSubjectKind,
        subjectNames: newSubjectNames,
        users: savedUsers,
        groups: savedGroups,
      }
    })
  }

  const setSubjectNames = (values: string[]) => setRoleBinding((rb) => ({ ...rb, subjectNames: values }))
  const setRoleNames = (values: string[]) => setRoleBinding((rb) => ({ ...rb, roleNames: values }))
  const setNamespaces = (values: string[]) => setRoleBinding((rb) => ({ ...rb, namespaces: values }))

  const onRoleBindingChange = useCallback((rb: RoleBinding[] | ClusterRoleBinding) => {
    if (rb) {
      const namespaces: string[] = Array.isArray(rb)
        ? [...new Set(rb.filter((rb) => rb.namespace).map((rb) => rb.namespace))]
        : [...new Set(rb.subjects?.filter((s) => s.namespace).map((s) => s.namespace))].filter((e) => e !== undefined)

      const subjectKind: 'User' | 'Group' | undefined = Array.isArray(rb)
        ? rb[0]?.subject?.kind ?? rb[0]?.subjects?.[0]?.kind
        : rb?.subject?.kind ?? rb?.subjects?.[0]?.kind

      const subjectNames: string[] = Array.isArray(rb)
        ? [...new Set(rb.flatMap((rb) => (rb.subject ? [rb.subject.name] : rb.subjects?.map((s) => s.name) ?? [])))]
        : [...new Set(rb.subjects?.map((s) => s.name) ?? (rb.subject ? [rb.subject.name] : []))]

      const clusterRoleBindingRoleName = (rb as ClusterRoleBinding).roleRef?.name
        ? [(rb as ClusterRoleBinding).roleRef.name]
        : []
      const roleNames: string[] = Array.isArray(rb)
        ? [...new Set(rb.map((rb) => rb.roleRef.name))]
        : clusterRoleBindingRoleName

      const wasPreFilled: boolean = Array.isArray(rb)
        ? rb.some((e) => !!e.roleRef?.name)
        : rb.roleRef?.name !== undefined && rb.roleRef?.name !== ''

      setRoleBinding((rb) => ({
        ...rb,
        namespaces,
        subjectKind: subjectKind ?? rb.subjectKind,
        subjectNames,
        roleNames,
        users: subjectKind === 'User' ? subjectNames : rb.users,
        groups: subjectKind === 'Group' ? subjectNames : rb.groups,
        wasPreFilled,
      }))
    }
  }, [])

  return {
    roleBinding,
    isValid,
    setSubjectKind,
    setSubjectNames,
    setRoleNames,
    setNamespaces,
    onRoleBindingChange,
  }
}

export { useRoleBinding }

/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'

const RoleBindingHook = <T>() => {
  const [selected, setSelected] = useState<T[]>([])
  const [selectedSubjectKind, setSelectedSubjectKind] = useState<'User' | 'Group'>('User')
  const [selectedSubjectNames, setSelectedSubjectNames] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([])
  const [selectedRoleName, setSelectedRoleName] = useState<string>()
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([])

  useEffect(() => {
    switch (selectedSubjectKind) {
      case 'Group':
        setSelectedGroups(selectedSubjectNames)
        break
      case 'User':
        setSelectedUsers(selectedSubjectNames)
        break
    }
  }, [selectedSubjectNames, selectedSubjectKind])

  const onNamespaceChange = (values: string[]) => setSelectedNamespaces(values)
  const onSubjectTypeChange = (value: string) => {
    setSelectedSubjectNames(value === 'group' ? selectedGroups : selectedUsers)
    setSelectedSubjectKind(value === 'group' ? 'Group' : 'User')
  }
  const onSubjectNameChange = (values: string[]) => setSelectedSubjectNames(values)
  const onRoleChange = (values: string[]) => {
    setSelectedRoleNames(values)
    setSelectedRoleName((values?.length && values[0]) || '')
  }

  return {
    selected,
    setSelected,
    selectedSubjectType: selectedSubjectKind,
    selectedSubjectNames,
    setSelectedSubjectNames,
    selectedRoleName,
    setSelectedRoleName,
    selectedRoleNames,
    setSelectedRoleNames,
    selectedNamespaces,
    setSelectedNamespaces,
    setSelectedSubjectKind: setSelectedSubjectKind,
    onNamespaceChange,
    onSubjectKindChange: onSubjectTypeChange,
    onSubjectNameChange,
    onRoleChange,
  }
}

export { RoleBindingHook }

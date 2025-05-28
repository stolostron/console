/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'

const RoleBindingHook = <T>() => {
  const [selected, setSelected] = useState<T[]>([])
  const [selectedSubjectType, setSelectedSubjectType] = useState<'User' | 'Group'>('User')
  const [selectedSubjectNames, setSelectedSubjectNames] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([])
  const [selectedRoleName, setSelectedRoleName] = useState<string>()
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([])

  useEffect(() => {
    switch (selectedSubjectType) {
      case 'Group':
        setSelectedGroups(selectedSubjectNames)
        break
      case 'User':
        setSelectedUsers(selectedSubjectNames)
        break
    }
  }, [selectedSubjectNames, selectedSubjectType])

  const onNamespaceChange = (values: string[]) => setSelectedNamespaces(values)
  const onSubjectTypeChange = (value: string) => {
    setSelectedSubjectNames(value === 'group' ? selectedGroups : selectedUsers)
    setSelectedSubjectType(value === 'group' ? 'Group' : 'User')
  }
  const onSubjectNameChange = (values: string[]) => setSelectedSubjectNames(values)
  const onRoleChange = (values: string[]) => {
    setSelectedRoleNames(values)
    setSelectedRoleName((values?.length && values[0]) || '')
  }

  return {
    selected,
    setSelected,
    selectedSubjectType,
    selectedSubjectNames,
    setSelectedSubjectNames,
    selectedRoleName,
    setSelectedRoleName,
    selectedRoleNames,
    setSelectedRoleNames,
    selectedNamespaces,
    setSelectedNamespaces,
    onNamespaceChange,
    onSubjectTypeChange,
    onSubjectNameChange,
    onRoleChange,
  }
}

export { RoleBindingHook }

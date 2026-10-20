/* Copyright Contributors to the Open Cluster Management project */
import { useOutletContext } from 'react-router'
import { Group, User } from '../../../../resources/rbac'

export type GroupDetailsContext = {
  readonly group?: Group
  readonly users?: User[]
}

export function useGroupDetailsContext() {
  return useOutletContext<GroupDetailsContext>()
}

/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useUserDetailsContext } from './UserPage'

export const useUserGroups = () => {
  const { user, groups } = useUserDetailsContext()
  // TODO: trigger sonar issue
  const userGroups = useMemo(() => {
    if (!user || !groups) return []

    return groups.filter((group) => group.users?.includes(user.metadata.name || ''))
  }, [user, groups])

  const userWithGroups = useMemo(() => {
    if (!user) return user

    const groupNames = userGroups.map((group) => group.metadata.name || '')

    return {
      ...user,
      groups: groupNames.length > 0 ? groupNames : null,
    }
  }, [user, userGroups])

  return {
    userGroups,
    userWithGroups,
  }
}

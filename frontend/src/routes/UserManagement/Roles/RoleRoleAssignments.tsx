/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { User } from '../../../resources'
import roleAssignmentsMockDataJson from '../../../resources/clients/mock-data/role-assignments.json'
import { RoleAssignment } from '../../../resources/role-assignment'
import { compareStrings } from '../../../ui-components'
import { RoleAssignments } from '../RoleAssignment/RoleAssignments'

// TODO: do it for Roles
const RoleRoleAssignments = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const [isLoading, setIsLoading] = useState<boolean>()
  const [user, setUser] = useState<User>()

  // TODO: to remove once API ready
  // Mock users data to match the role assignments
  const mockUsers = [
    { metadata: { name: 'alice.trask', uid: 'mock-user-alice-trask' } },
    { metadata: { name: 'bob.levy', uid: 'mock-user-bob-levy' } },
    { metadata: { name: 'charlie.cranston', uid: 'mock-user-charlie-cranston' } },
    { metadata: { name: 'sarah.jones', uid: 'mock-user-sarah-jones' } },
    { metadata: { name: 'david.brown', uid: 'mock-user-david-brown' } },
  ]

  // Use mock data only
  const users = mockUsers

  useEffect(() => setIsLoading(users !== undefined), [users])
  useEffect(() => setUser(users?.find((user) => user.metadata.uid === id) as User), [id, users])

  // Use role assignments mock data
  const roleAssignments = roleAssignmentsMockDataJson as RoleAssignment[]

  // Filter role assignments for the current user
  const userRoleAssignments = useMemo(
    () =>
      !user || !roleAssignments
        ? []
        : roleAssignments
            .filter((roleAssignment) =>
              roleAssignment.spec.subjects.some(
                (subject) => subject.kind === 'User' && subject.name === user.metadata.name
              )
            )
            .sort((a, b) => compareStrings(a.metadata?.name ?? '', b.metadata?.name ?? '')),
    [user, roleAssignments]
  )

  return !user ? (
    // TODO: to improve this empty state
    <div>{t('User not found')}</div>
  ) : (
    <RoleAssignments roleAssignments={userRoleAssignments} isLoading={isLoading} hiddenColumns={['subject']} />
  )
}

export { RoleRoleAssignments }

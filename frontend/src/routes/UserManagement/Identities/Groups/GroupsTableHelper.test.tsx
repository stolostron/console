/* Copyright Contributors to the Open Cluster Management project */
import { groupsTableColumns } from './GroupsTableHelper'
import { Group } from '../../../../resources/rbac'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'developers',
    uid: 'developers-uid',
    creationTimestamp: '2025-01-24T16:00:00Z',
  },
  users: ['user1', 'user2'],
}

describe('GroupsTableHelper', () => {
  describe('groupsTableColumns', () => {
    const columns = groupsTableColumns({ t: (key: string) => key })

    test('should return correct number of columns', () => {
      expect(columns).toHaveLength(4)
    })

    test('should have Name column with correct properties', () => {
      const nameColumn = columns.find((col) => col.header === 'Name')
      expect(nameColumn).toBeDefined()
      expect(nameColumn?.sort).toBe('metadata.name')
      expect(nameColumn?.search).toBe('metadata.name')
      expect(nameColumn?.transforms).toBeDefined()
    })

    test('should have Users column with correct properties', () => {
      const usersColumn = columns.find((col) => col.header === 'Users')
      expect(usersColumn).toBeDefined()
      expect(usersColumn?.sort).toBe('users.length')
    })

    test('should have Status column with correct properties', () => {
      const statusColumn = columns.find((col) => col.header === 'Status')
      expect(statusColumn).toBeDefined()
    })

    test('should have Created column with correct properties', () => {
      const createdColumn = columns.find((col) => col.header === 'Created')
      expect(createdColumn).toBeDefined()
      expect(createdColumn?.sort).toBe('metadata.creationTimestamp')
    })

    test('should export content correctly', () => {
      const nameColumn = columns.find((col) => col.header === 'Name')
      const createdColumn = columns.find((col) => col.header === 'Created')

      expect(nameColumn?.exportContent).toBeDefined()
      expect(createdColumn?.exportContent).toBeDefined()

      expect(nameColumn?.exportContent!(mockGroup, '')).toBe('developers')
      expect(createdColumn?.exportContent!(mockGroup, '')).toContain('2025-01-24')
    })
  })
})

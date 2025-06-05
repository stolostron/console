/* Copyright Contributors to the Open Cluster Management project */
import { act } from 'react-dom/test-utils'
import { renderHook } from '@testing-library/react-hooks'
import { useRoleBinding } from './RoleBindingHook'
import { mockClusterRoleBinding1, mockRoleBindings1, mockRoleBindings2 } from './AccessControlManagement.sharedmocks'

describe('RoleBindingHook', () => {
  describe('initial state', () => {
    it('should have correct default values', () => {
      const { result } = renderHook(() => useRoleBinding())

      expect(result.current.roleBinding.subjectKind).toBe('User')
      expect(result.current.roleBinding.subjectNames).toEqual([])
      expect(result.current.roleBinding.users).toEqual([])
      expect(result.current.roleBinding.groups).toEqual([])
      expect(result.current.roleBinding.roleNames).toEqual([])
      expect(result.current.roleBinding.namespaces).toEqual([])
      expect(result.current.isValid).toBe(false)
    })
  })

  describe('useRoleBinding', () => {
    describe('onRoleBindingChange', () => {
      describe.each([
        {
          name: 'update RoleBindings',
          roleBinding: mockRoleBindings1,
        },
        {
          name: 'update ClusterRoleBinding',
          roleBinding: mockClusterRoleBinding1,
        },
      ])('$name', ({ roleBinding }) => {
        const { result } = renderHook(() => useRoleBinding())
        let expectedSubjectKind: 'User' | 'Group' | undefined
        let expectedSubjectNames: string[]

        act(() => {
          result.current.onRoleBindingChange(roleBinding)
        })

        it('should update role names correctly', () => {
          const expectedRoleNames = Array.isArray(roleBinding)
            ? [...new Set(roleBinding.map((rb) => rb.roleRef.name))]
            : [roleBinding.roleRef.name]
          expect(result.current.roleBinding.roleNames).toEqual(expectedRoleNames)
        })

        it('should update namespaces correctly', () => {
          const expectedNamespaces = Array.isArray(roleBinding)
            ? [...new Set(roleBinding.filter((rb) => rb.namespace).map((rb) => rb.namespace))]
            : []
          expect(result.current.roleBinding.namespaces).toEqual(expectedNamespaces)
        })

        it('should update subject kind correctly', () => {
          expectedSubjectKind = Array.isArray(roleBinding)
            ? roleBinding[0]?.subjects?.[0].kind
            : roleBinding?.subjects?.[0].kind
          expect(result.current.roleBinding.subjectKind).toEqual(expectedSubjectKind)
        })

        it('should update subject names correctly', () => {
          expectedSubjectNames = Array.isArray(roleBinding)
            ? [...new Set(roleBinding.flatMap((rb) => rb.subjects?.map((s) => s.name) ?? []))]
            : [...new Set(roleBinding.subjects?.map((s) => s.name) ?? [])]
          expect(result.current.roleBinding.subjectNames).toEqual(expectedSubjectNames)
        })

        it('should update users and groups correctly', () => {
          const expectedUsers = expectedSubjectKind === 'User' ? expectedSubjectNames : []
          const expectedGroups = expectedSubjectKind === 'Group' ? expectedSubjectNames : []
          expect(result.current.roleBinding.users).toEqual(expectedUsers)
          expect(result.current.roleBinding.groups).toEqual(expectedGroups)
        })
      })
    })

    describe('isValid', () => {
      describe.each([
        {
          name: 'validate RoleBindings',
          roleBinding: mockRoleBindings1,
        },
        {
          name: 'validate ClusterRoleBinding',
          roleBinding: mockClusterRoleBinding1,
        },
      ])('$name', ({ roleBinding }) => {
        let result: any

        beforeEach(() => {
          const hookResult = renderHook(() => useRoleBinding())
          result = hookResult.result
          act(() => {
            result.current.onRoleBindingChange(roleBinding)
          })
        })

        it('should be invalid when role names are empty', () => {
          act(() => {
            result.current.setRoleNames([])
          })
          expect(result.current.isValid).toBe(false)
        })

        it('should be invalid when subject names are empty', () => {
          act(() => {
            result.current.setSubjectNames([])
          })
          expect(result.current.isValid).toBe(false)
        })

        it('should be valid when subject kind is empty because it defaults to User', () => {
          act(() => {
            result.current.setSubjectKind('')
          })
          expect(result.current.isValid).toBe(true)
        })

        it('should be valid when all required data is loaded', () => {
          expect(result.current.isValid).toBe(true)
        })
      })
    })

    describe('setSubjectKind and setSubjectNames', () => {
      describe.each([
        {
          name: 'set subjects for RoleBindings',
          roleBinding: mockRoleBindings1,
        },
        {
          name: 'set subjects for ClusterRoleBinding',
          roleBinding: mockClusterRoleBinding1,
        },
      ])('$name', ({ roleBinding }) => {
        let result: any

        beforeEach(() => {
          const hookResult = renderHook(() => useRoleBinding())
          result = hookResult.result
          act(() => {
            result.current.onRoleBindingChange(roleBinding)
          })
        })

        it('should update subject names correctly', () => {
          const expectedSubjectNames = ['newuser1', 'newuser2']
          act(() => {
            result.current.setSubjectNames(expectedSubjectNames)
          })
          expect(result.current.roleBinding.subjectNames).toEqual(expectedSubjectNames)
        })

        it('should update subject kind correctly', () => {
          const expectedSubjectKind = 'Group'
          act(() => {
            result.current.setSubjectKind(expectedSubjectKind)
          })
          expect(result.current.roleBinding.subjectKind).toEqual(expectedSubjectKind)
        })

        it('should keep users and groups state when switching between User and Group subject kinds', () => {
          const expectedGroups = ['group1', 'group2']
          const expectedUsers = Array.isArray(roleBinding)
            ? [...new Set(roleBinding.flatMap((rb) => rb.subjects?.map((s) => s.name) ?? []))]
            : [...new Set(roleBinding.subjects?.map((s) => s.name) ?? [])]
          act(() => {
            result.current.setSubjectKind('group')
            result.current.setSubjectNames(expectedGroups)
            result.current.setSubjectKind('user')
          })
          expect(result.current.roleBinding.subjectKind).toBe('User')
          expect(result.current.roleBinding.subjectNames).toEqual(expectedUsers)
          expect(result.current.roleBinding.users).toEqual(expectedUsers)
          expect(result.current.roleBinding.groups).toEqual(expectedGroups)
        })
      })
    })

    describe('setNamespaces', () => {
      describe.each([
        {
          name: 'set namespaces for RoleBindings',
          roleBinding: mockRoleBindings1,
          expectedNamespaces: ['newns1', 'newns2'],
        },
        {
          name: 'set namespaces for ClusterRoleBinding (none)',
          roleBinding: mockClusterRoleBinding1,
          expectedNamespaces: [],
        },
      ])('$name', ({ roleBinding, expectedNamespaces }) => {
        let result: any

        beforeEach(() => {
          const hookResult = renderHook(() => useRoleBinding())
          result = hookResult.result
          act(() => {
            result.current.onRoleBindingChange(roleBinding)
          })
        })

        it('should update namespaces correctly', () => {
          act(() => {
            result.current.setNamespaces(expectedNamespaces)
          })
          expect(result.current.roleBinding.namespaces).toEqual(expectedNamespaces)
        })
      })
    })

    describe('setRoleNames', () => {
      describe.each([
        {
          name: 'set role names for RoleBindings',
          roleBinding: mockRoleBindings1,
          expectedRoleNames: ['newrole1', 'newrole1'],
        },
        {
          name: 'set role name for ClusterRoleBinding',
          roleBinding: mockClusterRoleBinding1,
          expectedRoleNames: ['newclusterrole1'],
        },
      ])('$name', ({ roleBinding, expectedRoleNames }) => {
        let result: any

        beforeEach(() => {
          const hookResult = renderHook(() => useRoleBinding())
          result = hookResult.result
          act(() => {
            result.current.onRoleBindingChange(roleBinding)
          })
        })

        it('should update role names correctly', () => {
          act(() => {
            result.current.setRoleNames(expectedRoleNames)
          })
          expect(result.current.roleBinding.roleNames).toEqual(expectedRoleNames)
        })
      })
    })
  })

  describe('edge cases', () => {
    describe('onRoleBindingChange with null/undefined', () => {
      it.each([
        { value: null, name: 'null' },
        { value: undefined, name: 'undefined' },
      ])('$name should be handled gracefully', ({ value }) => {
        const { result } = renderHook(() => useRoleBinding())

        act(() => {
          result.current.onRoleBindingChange(value as any)
        })

        expect(result.current.roleBinding.subjectKind).toBe('User')
        expect(result.current.roleBinding.subjectNames).toEqual([])
        expect(result.current.roleBinding.roleNames).toEqual([])
        expect(result.current.roleBinding.namespaces).toEqual([])
      })
    })

    describe('onRoleBindingChange with single subject property', () => {
      it.each([
        {
          name: 'single subject property on RoleBinding',
          roleBinding: [
            {
              namespace: 'test-ns',
              roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole' as const,
                name: 'test-role',
              },
              subject: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'User' as const,
                name: 'single-user',
              },
            },
          ],
          expectedSubjectKind: 'User',
          expectedSubjectNames: ['single-user'],
          expectedUsers: ['single-user'],
          expectedGroups: [],
        },
        {
          name: 'single subject property on ClusterRoleBinding',
          roleBinding: {
            roleRef: {
              apiGroup: 'rbac.authorization.k8s.io',
              kind: 'ClusterRole' as const,
              name: 'cluster-test-role',
            },
            subject: {
              apiGroup: 'rbac.authorization.k8s.io',
              kind: 'Group' as const,
              name: 'single-group',
            },
          },
          expectedSubjectKind: 'Group',
          expectedSubjectNames: ['single-group'],
          expectedUsers: [],
          expectedGroups: ['single-group'],
        },
      ])(
        'should handle $name',
        ({ roleBinding, expectedSubjectKind, expectedSubjectNames, expectedUsers, expectedGroups }) => {
          const { result } = renderHook(() => useRoleBinding())

          act(() => {
            result.current.onRoleBindingChange(roleBinding as any)
          })

          expect(result.current.roleBinding.subjectKind).toBe(expectedSubjectKind)
          expect(result.current.roleBinding.subjectNames).toEqual(expectedSubjectNames)
          expect(result.current.roleBinding.users).toEqual(expectedUsers)
          expect(result.current.roleBinding.groups).toEqual(expectedGroups)
        }
      )
    })

    describe('onRoleBindingChange with Group subjects', () => {
      it('should handle Group subjects correctly', () => {
        const { result } = renderHook(() => useRoleBinding())

        act(() => {
          result.current.onRoleBindingChange(mockRoleBindings2)
        })

        expect(result.current.roleBinding.subjectKind).toBe('Group')
        expect(result.current.roleBinding.subjectNames).toEqual(['dev-team', 'ops-team'])
        expect(result.current.roleBinding.users).toEqual([])
        expect(result.current.roleBinding.groups).toEqual(['dev-team', 'ops-team'])
        expect(result.current.roleBinding.roleNames).toEqual(['developer'])
        expect(result.current.roleBinding.namespaces).toEqual(['development'])
      })
    })
  })
})

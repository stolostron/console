/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import { useRoleAssignmentFormData, RoleAssignmentFormDataType } from './RoleAssignmentFormDataHook'
import { UserKind, GroupKind } from '../../../../resources'
import { RoleAssignmentPreselected } from '../model/role-assignment-preselected'

jest.mock('lodash', () => ({
  get: jest.fn((obj, path) => {
    const keys = path.split('.')
    let result = obj
    for (const key of keys) {
      result = result?.[key]
    }
    return result
  }),
}))

describe('useRoleAssignmentFormData', () => {
  describe('Initial State', () => {
    it('should return initial form data with default values', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      expect(result.current.roleAssignmentFormData).toEqual({
        subject: { kind: UserKind },
        scope: {
          kind: 'all',
          clusterNames: [],
        },
        roles: [],
      })
    })

    it('should return all change handlers', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      expect(typeof result.current.onChangeSubjectKind).toBe('function')
      expect(typeof result.current.onChangeUserValue).toBe('function')
      expect(typeof result.current.onChangeGroupValue).toBe('function')
      expect(typeof result.current.onChangeScopeKind).toBe('function')
      expect(typeof result.current.onChangeScopeValues).toBe('function')
      expect(typeof result.current.onChangeScopeNamespaces).toBe('function')
      expect(typeof result.current.onChangeRoles).toBe('function')
    })
  })

  describe('Subject Management', () => {
    it('should change subject kind', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeSubjectKind(GroupKind)
      })

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(GroupKind)
    })

    it('should change user value', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeUserValue(['test-user'])
      })

      expect(result.current.roleAssignmentFormData.subject.user).toEqual(['test-user'])
    })

    it('should change group value', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeGroupValue(['test-group'])
      })

      expect(result.current.roleAssignmentFormData.subject.group).toEqual(['test-group'])
    })

    it('should clear user value when set to undefined', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeUserValue(['test-user'])
      })

      expect(result.current.roleAssignmentFormData.subject.user).toEqual(['test-user'])

      act(() => {
        result.current.onChangeUserValue(undefined)
      })

      expect(result.current.roleAssignmentFormData.subject.user).toBeUndefined()
    })

    it('should clear group value when set to undefined', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeGroupValue(['test-group'])
      })

      expect(result.current.roleAssignmentFormData.subject.group).toEqual(['test-group'])

      act(() => {
        result.current.onChangeGroupValue(undefined)
      })

      expect(result.current.roleAssignmentFormData.subject.group).toBeUndefined()
    })

    it('should clear group when switching to user kind', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeSubjectKind(GroupKind)
        result.current.onChangeGroupValue(['test-group'])
      })

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(GroupKind)
      expect(result.current.roleAssignmentFormData.subject.group).toEqual(['test-group'])

      act(() => {
        result.current.onChangeSubjectKind(UserKind)
      })

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(UserKind)
      expect(result.current.roleAssignmentFormData.subject.group).toBeUndefined()
    })

    it('should clear user when switching to group kind', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeSubjectKind(UserKind)
        result.current.onChangeUserValue(['test-user'])
      })

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(UserKind)
      expect(result.current.roleAssignmentFormData.subject.user).toEqual(['test-user'])

      act(() => {
        result.current.onChangeSubjectKind(GroupKind)
      })

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(GroupKind)
      expect(result.current.roleAssignmentFormData.subject.user).toBeUndefined()
    })
  })

  describe('Scope Management', () => {
    it('should change scope kind to specific', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeScopeKind('specific')
      })

      expect(result.current.roleAssignmentFormData.scope.kind).toBe('specific')
    })

    it('should change scope kind to all', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeScopeKind('specific')
      })

      expect(result.current.roleAssignmentFormData.scope.kind).toBe('specific')

      act(() => {
        result.current.onChangeScopeKind('all')
      })

      expect(result.current.roleAssignmentFormData.scope.kind).toBe('all')
    })

    it('should change scope cluster names', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      const clusterNames = ['cluster-1', 'cluster-2', 'cluster-3']

      act(() => {
        result.current.onChangeScopeValues(clusterNames)
      })

      expect(result.current.roleAssignmentFormData.scope.clusterNames).toEqual(clusterNames)
    })

    it('should change scope namespaces', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      const namespaces = ['namespace-1', 'namespace-2']

      act(() => {
        result.current.onChangeScopeNamespaces(namespaces)
      })

      expect(result.current.roleAssignmentFormData.scope.namespaces).toEqual(namespaces)
    })

    it('should handle empty cluster names array', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeScopeValues([])
      })

      expect(result.current.roleAssignmentFormData.scope.clusterNames).toEqual([])
    })

    it('should handle empty namespaces array', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeScopeNamespaces([])
      })

      expect(result.current.roleAssignmentFormData.scope.namespaces).toEqual([])
    })
  })

  describe('Roles Management', () => {
    it('should change roles', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      const roles = ['admin', 'view', 'edit']

      act(() => {
        result.current.onChangeRoles(roles)
      })

      expect(result.current.roleAssignmentFormData.roles).toEqual(roles)
    })

    it('should handle empty roles array', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeRoles([])
      })

      expect(result.current.roleAssignmentFormData.roles).toEqual([])
    })

    it('should replace existing roles', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeRoles(['admin', 'view'])
      })

      expect(result.current.roleAssignmentFormData.roles).toEqual(['admin', 'view'])

      act(() => {
        result.current.onChangeRoles(['edit', 'create'])
      })

      expect(result.current.roleAssignmentFormData.roles).toEqual(['edit', 'create'])
    })
  })

  describe('Preselected Data', () => {
    it('should handle preselected user subject', () => {
      const preselected: RoleAssignmentPreselected = {
        subject: {
          kind: UserKind,
          value: 'preselected-user',
        },
      }

      const { result } = renderHook(() => useRoleAssignmentFormData(preselected))

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(UserKind)
      expect(result.current.roleAssignmentFormData.subject.user).toEqual(['preselected-user'])
    })

    it('should handle preselected group subject', () => {
      const preselected: RoleAssignmentPreselected = {
        subject: {
          kind: GroupKind,
          value: 'preselected-group',
        },
      }

      const { result } = renderHook(() => useRoleAssignmentFormData(preselected))

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(GroupKind)
      expect(result.current.roleAssignmentFormData.subject.group).toEqual(['preselected-group'])
    })

    it('should handle preselected roles', () => {
      const preselected: RoleAssignmentPreselected = {
        roles: ['admin', 'view'],
      }

      const { result } = renderHook(() => useRoleAssignmentFormData(preselected))

      expect(result.current.roleAssignmentFormData.roles).toEqual(['admin', 'view'])
    })

    it('should handle preselected cluster sets', () => {
      const preselected: RoleAssignmentPreselected = {
        cluterSets: ['cluster-set-1', 'cluster-set-2'],
      }

      const { result } = renderHook(() => useRoleAssignmentFormData(preselected))

      expect(result.current.roleAssignmentFormData).toBeDefined()
    })

    it('should handle complete preselected data', () => {
      const preselected: RoleAssignmentPreselected = {
        subject: {
          kind: UserKind,
          value: 'test-user',
        },
        roles: ['admin', 'view'],
        cluterSets: ['cluster-set-1'],
      }

      const { result } = renderHook(() => useRoleAssignmentFormData(preselected))

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(UserKind)
      expect(result.current.roleAssignmentFormData.subject.user).toEqual(['test-user'])
      expect(result.current.roleAssignmentFormData.roles).toEqual(['admin', 'view'])
    })

    it('should handle undefined preselected data', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData(undefined))

      expect(result.current.roleAssignmentFormData).toEqual({
        subject: { kind: UserKind },
        scope: {
          kind: 'all',
          clusterNames: [],
        },
        roles: [],
      })
    })

    it('should handle empty preselected data', () => {
      const preselected: RoleAssignmentPreselected = {}

      const { result } = renderHook(() => useRoleAssignmentFormData(preselected))

      expect(result.current.roleAssignmentFormData).toEqual({
        subject: { kind: UserKind },
        scope: {
          kind: 'all',
          clusterNames: [],
        },
        roles: [],
      })
    })
  })

  describe('State Updates', () => {
    it('should preserve other state when updating subject', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeRoles(['admin'])
        result.current.onChangeScopeValues(['cluster-1'])
        result.current.onChangeScopeNamespaces(['namespace-1'])
      })

      const initialState = result.current.roleAssignmentFormData

      act(() => {
        result.current.onChangeSubjectKind(GroupKind)
      })

      expect(result.current.roleAssignmentFormData.subject.kind).toBe(GroupKind)
      expect(result.current.roleAssignmentFormData.roles).toEqual(initialState.roles)
      expect(result.current.roleAssignmentFormData.scope.clusterNames).toEqual(initialState.scope.clusterNames)
      expect(result.current.roleAssignmentFormData.scope.namespaces).toEqual(initialState.scope.namespaces)
    })

    it('should preserve other state when updating scope', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeRoles(['admin'])
        result.current.onChangeUserValue(['test-user'])
      })

      const initialState = result.current.roleAssignmentFormData

      act(() => {
        result.current.onChangeScopeKind('specific')
      })

      expect(result.current.roleAssignmentFormData.scope.kind).toBe('specific')
      expect(result.current.roleAssignmentFormData.roles).toEqual(initialState.roles)
      expect(result.current.roleAssignmentFormData.subject.user).toBe(initialState.subject.user)
    })

    it('should preserve other state when updating roles', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeUserValue(['test-user'])
        result.current.onChangeScopeValues(['cluster-1'])
      })

      const initialState = result.current.roleAssignmentFormData

      act(() => {
        result.current.onChangeRoles(['admin', 'view'])
      })

      expect(result.current.roleAssignmentFormData.roles).toEqual(['admin', 'view'])
      expect(result.current.roleAssignmentFormData.subject.user).toBe(initialState.subject.user)
      expect(result.current.roleAssignmentFormData.scope.clusterNames).toEqual(initialState.scope.clusterNames)
    })
  })

  describe('Callback Stability', () => {
    it('should return stable callback references', () => {
      const { result, rerender } = renderHook(() => useRoleAssignmentFormData())

      const firstCallbacks = {
        onChangeSubjectKind: result.current.onChangeSubjectKind,
        onChangeUserValue: result.current.onChangeUserValue,
        onChangeGroupValue: result.current.onChangeGroupValue,
        onChangeScopeKind: result.current.onChangeScopeKind,
        onChangeScopeValues: result.current.onChangeScopeValues,
        onChangeScopeNamespaces: result.current.onChangeScopeNamespaces,
        onChangeRoles: result.current.onChangeRoles,
      }

      rerender()

      const secondCallbacks = {
        onChangeSubjectKind: result.current.onChangeSubjectKind,
        onChangeUserValue: result.current.onChangeUserValue,
        onChangeGroupValue: result.current.onChangeGroupValue,
        onChangeScopeKind: result.current.onChangeScopeKind,
        onChangeScopeValues: result.current.onChangeScopeValues,
        onChangeScopeNamespaces: result.current.onChangeScopeNamespaces,
        onChangeRoles: result.current.onChangeRoles,
      }

      expect(firstCallbacks.onChangeSubjectKind).toBe(secondCallbacks.onChangeSubjectKind)
      expect(firstCallbacks.onChangeUserValue).toBe(secondCallbacks.onChangeUserValue)
      expect(firstCallbacks.onChangeGroupValue).toBe(secondCallbacks.onChangeGroupValue)
      expect(firstCallbacks.onChangeScopeKind).toBe(secondCallbacks.onChangeScopeKind)
      expect(firstCallbacks.onChangeScopeValues).toBe(secondCallbacks.onChangeScopeValues)
      expect(firstCallbacks.onChangeScopeNamespaces).toBe(secondCallbacks.onChangeScopeNamespaces)
      expect(firstCallbacks.onChangeRoles).toBe(secondCallbacks.onChangeRoles)
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid subject kind gracefully', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeSubjectKind('invalid-kind' as any)
      })

      expect(result.current.roleAssignmentFormData.subject.kind).toBe('invalid-kind')
    })

    it('should handle invalid scope kind gracefully', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeScopeKind('invalid-scope' as any)
      })

      expect(result.current.roleAssignmentFormData.scope.kind).toBe('invalid-scope')
    })

    it('should handle null/undefined values in arrays', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      act(() => {
        result.current.onChangeScopeValues(['cluster-1', null as any, 'cluster-2'])
      })

      expect(result.current.roleAssignmentFormData.scope.clusterNames).toEqual(['cluster-1', null, 'cluster-2'])
    })

    it('should handle very long arrays', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      const longArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`)

      act(() => {
        result.current.onChangeScopeValues(longArray)
      })

      expect(result.current.roleAssignmentFormData.scope.clusterNames).toEqual(longArray)
    })
  })

  describe('Type Safety', () => {
    it('should maintain correct types for RoleAssignmentFormDataType', () => {
      const { result } = renderHook(() => useRoleAssignmentFormData())

      const formData: RoleAssignmentFormDataType = result.current.roleAssignmentFormData

      expect(typeof formData.subject.kind).toBe('string')
      expect(typeof formData.scope.kind).toBe('string')
      expect(Array.isArray(formData.scope.clusterNames)).toBe(true)
      expect(Array.isArray(formData.roles)).toBe(true)
    })
  })
})

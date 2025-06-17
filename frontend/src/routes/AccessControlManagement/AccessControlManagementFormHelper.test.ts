/* Copyright Contributors to the Open Cluster Management project */
import {
  AccessControl,
  AccessControlApiVersion,
  AccessControlKind,
  ClusterRoleBinding,
  RoleBinding,
} from '../../resources/access-control'
import { RoleBindingHookType } from './RoleBindingHook'
import { buildAccessControlFromState, getRoleBindingNames } from './AccessControlManagementFormHelper'
import {
  mockClusterRoleBinding1,
  mockClusterRoleBinding2,
  mockRoleBindings1,
  mockRoleBindings2,
  mockRoleBindings3,
} from './AccessControlManagement.sharedmocks'

describe('AccessControlManagementFormHelper', () => {
  describe('buildAccessControlFromState', () => {
    const accessControlName = 'accesscontrol-1'
    const clusterName = 'cluster01'

    const generateAccessControl = (spec: { roleBindings?: RoleBinding[]; clusterRoleBinding?: ClusterRoleBinding }) => {
      return [
        {
          apiVersion: AccessControlApiVersion,
          kind: AccessControlKind,
          metadata: {
            name: accessControlName,
            namespace: clusterName,
          },
          spec,
        },
      ]
    }

    const usersRoleBindingHookData: RoleBindingHookType = {
      subjectKind: 'User',
      subjectNames: ['Bob', 'Luke'],
      users: ['Bob', 'Luke'],
      groups: [],
      roleNames: ['admin-access', 'read-only'],
      namespaces: ['dev', 'test'],
      wasPreFilled: false,
    }

    const usersClusterRoleBindingHookData: RoleBindingHookType = {
      subjectKind: 'User',
      subjectNames: ['Jill', 'Stan'],
      users: ['Jill', 'Stan'],
      groups: [],
      roleNames: ['cluster-admin'],
      namespaces: [],
      wasPreFilled: false,
    }

    const groupsRoleBindingHookData: RoleBindingHookType = {
      subjectKind: 'Group',
      subjectNames: ['dev-team', 'ops-team'],
      users: [],
      groups: ['dev-team', 'ops-team'],
      roleNames: ['developer'],
      namespaces: ['development'],
      wasPreFilled: false,
    }

    const groupClusterRoleBindingHookData: RoleBindingHookType = {
      subjectKind: 'Group',
      subjectNames: ['admin-group'],
      users: [],
      groups: ['admin-group'],
      roleNames: ['cluster-admin'],
      namespaces: [],
      wasPreFilled: false,
    }

    const emptyRoleBindingHookData: RoleBindingHookType = {
      subjectKind: 'User',
      subjectNames: [],
      users: [],
      groups: [],
      roleNames: [],
      namespaces: [],
      wasPreFilled: false,
    }

    const singleRoleBindingHookData: RoleBindingHookType = {
      subjectKind: 'User',
      subjectNames: ['single-user'],
      users: ['single-user'],
      groups: [],
      roleNames: ['single-role'],
      namespaces: ['single-namespace'],
      wasPreFilled: false,
    }

    it.each([
      {
        description: 'should build AccessControl with only RoleBindings when isRBValid is true and isCRBValid is false',
        isRBValid: true,
        isCRBValid: false,
        roleBindingHookData: usersRoleBindingHookData,
        clusterRoleBindingHookData: usersClusterRoleBindingHookData,
        expectedSpec: { roleBindings: mockRoleBindings1 },
        preservedNames: undefined,
      },
      {
        description:
          'should build AccessControl with only ClusterRoleBinding when isRBValid is false and isCRBValid is true',
        isRBValid: false,
        isCRBValid: true,
        roleBindingHookData: usersRoleBindingHookData,
        clusterRoleBindingHookData: usersClusterRoleBindingHookData,
        expectedSpec: { clusterRoleBinding: mockClusterRoleBinding1 },
        preservedNames: undefined,
      },
      {
        description:
          'should build AccessControl with RoleBindings and ClusterRoleBinding when both isRBValid and isCRBValid are true',
        isRBValid: true,
        isCRBValid: true,
        roleBindingHookData: usersRoleBindingHookData,
        clusterRoleBindingHookData: usersClusterRoleBindingHookData,
        expectedSpec: { roleBindings: mockRoleBindings1, clusterRoleBinding: mockClusterRoleBinding1 },
        preservedNames: undefined,
      },
      {
        description: 'should build AccessControl with empty spec when both isRBValid and isCRBValid are false',
        isRBValid: false,
        isCRBValid: false,
        roleBindingHookData: usersRoleBindingHookData,
        clusterRoleBindingHookData: usersClusterRoleBindingHookData,
        expectedSpec: {},
        preservedNames: undefined,
      },
      {
        description: 'should handle Group subjects in RoleBindings',
        isRBValid: true,
        isCRBValid: false,
        roleBindingHookData: groupsRoleBindingHookData,
        clusterRoleBindingHookData: usersClusterRoleBindingHookData,
        expectedSpec: { roleBindings: mockRoleBindings2 },
        preservedNames: undefined,
      },
      {
        description: 'should handle Group subjects in ClusterRoleBinding',
        isRBValid: false,
        isCRBValid: true,
        roleBindingHookData: usersRoleBindingHookData,
        clusterRoleBindingHookData: groupClusterRoleBindingHookData,
        expectedSpec: { clusterRoleBinding: mockClusterRoleBinding2 },
        preservedNames: undefined,
      },
      {
        description: 'should handle empty rolebinding data',
        isRBValid: true,
        isCRBValid: false,
        roleBindingHookData: emptyRoleBindingHookData,
        clusterRoleBindingHookData: usersClusterRoleBindingHookData,
        expectedSpec: { roleBindings: [] },
        preservedNames: undefined,
      },
      {
        description: 'should handle single namespace and role in RoleBindings',
        isRBValid: true,
        isCRBValid: false,
        roleBindingHookData: singleRoleBindingHookData,
        clusterRoleBindingHookData: usersClusterRoleBindingHookData,
        expectedSpec: { roleBindings: mockRoleBindings3 },
        preservedNames: undefined,
      },
    ])(
      '$description',
      ({ isRBValid, isCRBValid, roleBindingHookData, clusterRoleBindingHookData, expectedSpec, preservedNames }) => {
        const result = buildAccessControlFromState(
          isRBValid,
          isCRBValid,
          roleBindingHookData,
          clusterRoleBindingHookData,
          accessControlName,
          clusterName,
          preservedNames
        )

        const expected = generateAccessControl(expectedSpec)

        expect(result).toEqual(expected)
        expect(result).toHaveLength(1)
        expect(result[0].metadata.name).toBe(accessControlName)
        expect(result[0].metadata.namespace).toBe(clusterName)
        expect(result[0].apiVersion).toBe(AccessControlApiVersion)
        expect(result[0].kind).toBe(AccessControlKind)

        const actualRoleBindings = result[0].spec?.roleBindings ?? []
        const expectedCount = expectedSpec.roleBindings?.length ?? 0

        expect(actualRoleBindings).toHaveLength(expectedCount)

        for (let index = 0; index < expectedCount; index++) {
          expect(actualRoleBindings[index].name).toBe(`${accessControlName}-${index}`)
        }
      }
    )
  })
})
describe('getRoleBindingNames', () => {
  it('should return roleBinding names when present', () => {
    const accessControl = {
      spec: {
        roleBindings: [{ name: 'rb1' }, { name: 'rb2' }],
      },
    } as AccessControl

    expect(getRoleBindingNames(accessControl)).toEqual(['rb1', 'rb2'])
  })

  it('should return empty array when roleBindings are missing', () => {
    expect(getRoleBindingNames(undefined)).toEqual([])
    expect(getRoleBindingNames({} as AccessControl)).toEqual([])
  })
})

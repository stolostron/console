/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { accessControlState } from '../../atoms'
import { AccessControl } from '../../resources/access-control'
import { useAccessControlFilter } from './AccessControlManagementTableHelper'

function TestFilteredAccessControlMiniPage(props: { mockState: AccessControl[] }) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(accessControlState, props.mockState)
      }}
    >
      <FilteredAccessControlDisplay />
    </RecoilRoot>
  )
}

function FilteredAccessControlDisplay() {
  const accessControls = useAccessControlFilter()
  return <div id="filtered">{JSON.stringify(accessControls)}</div>
}

describe('test useFilterAccessControl', () => {
  test('should filter out if rolebindings are empty', () => {
    const filterOut: AccessControl[] = [
      {
        apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
        kind: 'ClusterPermission',
        metadata: { name: 'test1', namespace: 'cluster1' },
        spec: { roleBindings: undefined as any },
      },
    ]
    render(<TestFilteredAccessControlMiniPage mockState={filterOut} />)
    expect(screen.getByTestId('filtered').textContent).toBe('[]')
  })

  test('should filter out because of non kubevirt rolebindings', () => {
    const filterOut: AccessControl[] = [
      {
        apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
        kind: 'ClusterPermission',
        metadata: { name: 'test1', namespace: 'cluster1' },
        spec: {
          roleBindings: [
            {
              namespace: 'ns1',
              roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'randomrole' },
              subject: { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'user1' },
            },
          ],
        },
      },
    ]
    render(<TestFilteredAccessControlMiniPage mockState={filterOut} />)
    expect(screen.getByTestId('filtered').textContent).toBe('[]')
  })

  test('should keep first two because of matching rolebinding name', () => {
    const filterKeep1: AccessControl = {
      apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
      kind: 'ClusterPermission',
      metadata: { name: 'test1', namespace: 'cluster1' },
      spec: {
        roleBindings: [
          {
            namespace: 'ns1',
            roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'kubevirt.io:view' },
            subject: { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'user1' },
          },
        ],
      },
    }
    const filterKeep2: AccessControl = {
      apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
      kind: 'ClusterPermission',
      metadata: { name: 'test2', namespace: 'cluster1' },
      spec: {
        roleBindings: [
          {
            namespace: 'ns2',
            roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'kubevirt.io:edit' },
            subject: { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'user1' },
          },
        ],
      },
    }
    const filterOut: AccessControl = {
      apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
      kind: 'ClusterPermission',
      metadata: { name: 'test3', namespace: 'cluster1' },
      spec: {
        roleBindings: [
          {
            namespace: 'ns3',
            roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'randomrole' },
            subject: { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'user1' },
          },
        ],
      },
    }
    render(<TestFilteredAccessControlMiniPage mockState={[filterKeep1, filterKeep2, filterOut]} />)
    expect(screen.getByTestId('filtered').textContent).toBe(JSON.stringify([filterKeep1, filterKeep2]))
  })

  test('should keep if any of multiple rolebinding names match, even if other rolebinding does not match', () => {
    const filterKeep: AccessControl = {
      apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
      kind: 'ClusterPermission',
      metadata: { name: 'test1', namespace: 'cluster1' },
      spec: {
        roleBindings: [
          {
            namespace: 'ns1',
            roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'randomrole' },
            subject: { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'user1' },
          },
          {
            namespace: 'ns2',
            roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'kubevirt.io:admin' },
            subject: { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'user1' },
          },
        ],
      },
    }
    render(<TestFilteredAccessControlMiniPage mockState={[filterKeep]} />)
    expect(screen.getByTestId('filtered').textContent).toBe(JSON.stringify([filterKeep]))
  })
})

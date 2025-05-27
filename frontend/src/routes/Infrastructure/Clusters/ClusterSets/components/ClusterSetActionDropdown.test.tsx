/* Copyright Contributors to the Open Cluster Management project */

import {
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
} from '../../../../../resources'
import { render, screen } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { managedClusterSetBindingsState, namespacesState } from '../../../../../atoms'
import { nockCreate, nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { mockManagedClusterSet } from '../../../../../lib/test-metadata'
import {
  clickByLabel,
  clickByRole,
  clickByText,
  typeByText,
  waitForNock,
  waitForNocks,
  waitForText,
} from '../../../../../lib/test-util'
import { ClusterSetActionDropdown } from './ClusterSetActionDropdown'
import { MemoryRouter } from 'react-router-dom-v5-compat'

const firstNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: 'first-namespace',
  },
}

const secondNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: 'second-namespace',
  },
}

const thirdNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: 'third-namespace',
  },
}

const firstNamespaceBinding: ManagedClusterSetBinding = {
  apiVersion: ManagedClusterSetBindingApiVersion,
  kind: ManagedClusterSetBindingKind,
  metadata: {
    name: mockManagedClusterSet.metadata.name!,
    namespace: firstNamespace.metadata.name!,
  },
  spec: {
    clusterSet: mockManagedClusterSet.metadata.name!,
  },
}

const createSecondNamespaceBinding: ManagedClusterSetBinding = {
  apiVersion: ManagedClusterSetBindingApiVersion,
  kind: ManagedClusterSetBindingKind,
  metadata: {
    name: mockManagedClusterSet.metadata.name!,
    namespace: secondNamespace.metadata.name!,
  },
  spec: {
    clusterSet: mockManagedClusterSet.metadata.name!,
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews2 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        name: 'test-cluster-set',
        resource: 'managedclustersets',
        subresource: 'bind',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersets',
        subresource: 'bind',
        name: 'test-cluster-set',
      },
    },
    status: {
      allowed: true,
      reason:
        'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews3 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        name: 'test-cluster-set',
        resource: 'managedclustersets',
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersets',
        name: 'test-cluster-set',
      },
    },
    status: {
      allowed: true,
      reason:
        'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews4 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        name: 'test-cluster-set',
        resource: 'managedclustersets',
        subresource: 'join',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersets',
        subresource: 'join',
        name: 'test-cluster-set',
      },
    },
    status: {
      allowed: true,
      reason:
        'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews5 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        resource: 'managedclustersetbindings',
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersetbindings',
      },
    },
    status: {
      allowed: false,
      reason: 'Not authorized',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews6 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        resource: 'managedclustersetbindings',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersetbindings',
      },
    },
    status: {
      allowed: false,
      reason: 'Not authorized',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews7 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        namespace: 'first-namespace',
        resource: 'managedclustersetbindings',
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersetbindings',
        namespace: 'first-namespace',
      },
    },
    status: {
      allowed: true,
      reason:
        'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews8 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        namespace: 'first-namespace',
        resource: 'managedclustersetbindings',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersetbindings',
        namespace: 'first-namespace',
      },
    },
    status: {
      allowed: true,
      reason:
        'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews9 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        namespace: 'second-namespace',
        resource: 'managedclustersetbindings',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersetbindings',
        namespace: 'second-namespace',
      },
    },
    status: {
      allowed: true,
      reason:
        'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
    },
  },
}

//---create 'SelfSubjectAccessReview'---
const createSelfsubjectaccessreviews10 = {
  req: {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
      resourceAttributes: {
        namespace: 'third-namespace',
        resource: 'managedclustersetbindings',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
      },
    },
  },
  res: {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    spec: {
      resourceAttributes: {
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        resource: 'managedclustersetbindings',
        namespace: 'third-namespace',
      },
    },
    status: {
      allowed: true,
      reason:
        'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
    },
  },
}

const Component = () => (
  <RecoilRoot
    initializeState={(snapshot) => {
      snapshot.set(namespacesState, [firstNamespace, secondNamespace, thirdNamespace])
      snapshot.set(managedClusterSetBindingsState, [firstNamespaceBinding])
    }}
  >
    <MemoryRouter>
      <ClusterSetActionDropdown managedClusterSet={mockManagedClusterSet} isKebab={false} />
    </MemoryRouter>
  </RecoilRoot>
)

describe('ClusterSetActionDropdown', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  test('can edit managed cluster set bindings for a cluster set', async () => {
    render(<Component />)
    nockCreate(createSelfsubjectaccessreviews2.req, createSelfsubjectaccessreviews2.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews3.req, createSelfsubjectaccessreviews3.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews4.req, createSelfsubjectaccessreviews4.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews5.req, createSelfsubjectaccessreviews5.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews6.req, createSelfsubjectaccessreviews6.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews7.req, createSelfsubjectaccessreviews7.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews8.req, createSelfsubjectaccessreviews8.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews9.req, createSelfsubjectaccessreviews9.res).persist() // create 'SelfSubjectAccessReview'
    nockCreate(createSelfsubjectaccessreviews10.req, createSelfsubjectaccessreviews10.res).persist() // create 'SelfSubjectAccessReview'

    await clickByLabel('Actions')
    await clickByRole('menuitem', { name: 'Edit namespace bindings' })

    // verify existing binding is selected
    await waitForText(firstNamespaceBinding.metadata.namespace!)
    screen
      .getByRole('combobox', {
        name: /Namespaces/i,
      })
      .click()

    // unselect existing binding
    await clickByText(firstNamespaceBinding.metadata.namespace!, 1)

    await clickByText(createSecondNamespaceBinding.metadata.namespace!)

    const deleteNock = nockDelete(firstNamespaceBinding)
    const createNock = nockCreate(createSecondNamespaceBinding)

    await clickByText('Save')
    await waitForText('Saving')
    await waitForNocks([deleteNock, createNock])
  })

  test('delete action should delete the managed cluster set', async () => {
    render(<Component />)
    nockIgnoreRBAC()
    const nock = nockDelete(mockManagedClusterSet)
    await clickByLabel('Actions')
    await clickByRole('menuitem', { name: 'Delete cluster set' })

    await typeByText(
      `Confirm by typing "${mockManagedClusterSet.metadata.name!}" below:`,
      mockManagedClusterSet.metadata.name!
    )

    await clickByText('Delete')
    await waitForNock(nock)
  })
})

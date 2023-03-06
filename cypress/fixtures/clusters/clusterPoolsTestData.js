/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

export const testData = {
    credentials: 'clc-automation-pools-rbac',
    clusterPoolName: 'clc-automation-pools-rbac',
    clusterPoolNamespace: 'clc-automation-pools-rbac-ns',
    clusterRolebindingPrefix: 'crb-clc-auto-',
    roleBindingPrefix: 'rb-clc-auto-',
    clusterSetName: 'clc-clusterpool-rbac-clusterset'
}

export const userData = {
    adminClusterRole: 'admin',
    editClusterRole: 'edit',
    viewClusterRole: 'view',
    adminClusterUser: 'clc-e2e-admin-cluster',
    editClusterUser: 'clc-e2e-edit-cluster',
    viewClusterUser: 'clc-e2e-view-cluster',
    adminNamespaceUser: 'clc-e2e-admin-ns',
    viewNamespaceUser: 'clc-e2e-view-ns',
    editNamespaceUser: 'clc-e2e-edit-ns',
    clusterAdminRole: 'open-cluster-management:cluster-manager-admin',
}
module.exports = {
    testData: {
        clusterSetAdminRole: "Cluster set admin",
        clusterSetBindRole: "Cluster set bind",
        clusterSetViewRole: "Cluster set view",
        clusterSetAdminUser: "clc-e2e-clusterset-admin-cluster",
        clusterSetBindUser: "clc-e2e-clusterset-bind-cluster",
        clusterSetViewUser: "clc-e2e-clusterset-view-cluster",
        adminUser: "clc-e2e-admin-cluster",
        viewUser: "clc-e2e-view-cluster",
        bindUser: "clc-e2e-bind-cluster",
        adminClusterRole: 'open-cluster-management:cluster-manager-admin',
        namespaceBind: 'default',
        defaultClusterSet: 'default',
        globalClusterSet: 'global',
        clusterSetPoolPrefix: 'clc-auto-clustersetpool-',
        clusterSetPrefix: 'clc-auto-clusterset-',
        clusterRolebindingPrefix: 'crb-test-clc-',
        invalidClusterSetName: 'invalid_clusterSet'
    },
    action: {
        RHACM4K_4237: {
            testData: {
                clusterPoolName: "clc-auto-clustersetpool-4237",
                clusterSet1: "clc-auto-clusterset-4237-1",
                clusterSet2: "clc-auto-clusterset-4237-2"
            }
        }
    }
}
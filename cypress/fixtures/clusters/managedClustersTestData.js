module.exports = {
    rbac: {
        testCase: {
            RHACM4K_929: {
                testData: {
                    clusterLabels: 'clc-qe-rbac=automation-929'
                }
            },
            RHACM4K_973: {
                testData: {
                    clusterLabels: 'clc-qe-rbac=automation-973'
                }
            }
        },
        testData: {
            clusterAdminUser: 'clc-e2e-admin-cluster',
            clusterAdminRole: 'open-cluster-management:cluster-manager-admin',
            managedclusterAdminRolePrefix: 'open-cluster-management:admin:',
            managedclusterAdminUser: 'clc-e2e-admin-ns',
            managedclusterViewRolePrefix: 'open-cluster-management:view:',
            managedclusterViewUser: 'clc-e2e-view-ns',
            clusterRolebindingPrefix: 'crb-test-clc-',
            rolebindingPrefix: 'rb-test-clc-',
            managedClusterPrefix: 'acmqe-clc-rbac-cluster'
        }
    },
    action: {
        testCase: {
            RHACM4K_1588: {
                testData: {
                    clusterlabels: 'clc-qe=automation'
                }
            }
        }
    },
    addon: {
        testCase: {
            RHACM4K_1585: {
                testData: {
                    clusterName: 'acmqe-clc-rhacm4k-1585'
                }
            }
        }
    },
    testCase: {
        clusters: {
            aws: {
                clusterName: 'acmqe-managed-1',
                releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.3-x86_64',
                clusterSet: '',
                additionalLabels: 'owner=acmqe-clc-auto',
                region: 'us-east-2',
                timeout: 80 // minutes,
            },

            gcp: {
                clusterName: 'dhrpatel-483-test-gcp-auto',
                releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.3-x86_64',
                clusterSet: '',
                additionalLabels: 'owner=acmqe-clc-auto',
                region: 'us-central1',
                timeout: 80 // minutes,
            },

            azure: {
                clusterName: 'dhrpatel-483-test-azure-auto',
                releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.3-x86_64',
                clusterSet: '',
                additionalLabels: 'owner=acmqe-clc-auto',
                region: 'eastus',
                timeout: 90 // minutes
            },

            vmware: {
                clusterName: '',
                releaseImage: '',
                timeout: 80, // minutes,
                network: 'vSphere network',
                apiVIP: '1.1.1.1',
                ingressVIP: '2.2.2.2'
            }
        }
    }
}

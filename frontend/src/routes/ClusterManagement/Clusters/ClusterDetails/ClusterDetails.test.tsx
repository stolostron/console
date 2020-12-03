import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Switch, Route } from 'react-router-dom'
import { ManagedClusterInfo, ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../../../resources/managed-cluster-info'
import { ClusterDeployment, ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../../../../resources/cluster-deployment'
import { CertificateSigningRequestList, CertificateSigningRequestListApiVersion, CertificateSigningRequestListKind, CertificateSigningRequestApiVersion, CertificateSigningRequestKind } from '../../../../resources/certificate-signing-requests'
import { nockGet, nockClusterList } from '../../../../lib/nock-util'
import { NavigationPath } from '../../../../NavigationPath'
import ClusterDetails from './ClusterDetails'

const mockManagedClusterInfo: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'test-cluster', namespace: 'test-cluster' },
    status: {
        nodeList: [
            {
                name: "ip-10-0-134-240.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-west-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1c",
                    "node-role.kubernetes.io/worker": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
            {
                name: "ip-10-0-130-30.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-east-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1a",
                    "node-role.kubernetes.io/master": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                capacity: {
                    "cpu": "4",
                    "memory": "15944104Ki"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
            {
                name: "ip-10-0-151-254.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-south-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1b",
                    "node-role.kubernetes.io/master": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                capacity: {
                    "cpu": "4",
                    "memory": "8194000Pi"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
        ]
    }
}
const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
       labels: {
          cloud: "AWS",
          'hive.openshift.io/cluster-platform': "aws",
          'hive.openshift.io/cluster-region': "us-east-1",
          region: "us-east-1",
          vendor: "OpenShift"
       },
       name: "test-cluster",
       namespace: "test-cluster",
       resourceVersion: "47731421",
       selfLink: "/apis/hive.openshift.io/v1/namespaces/test-cluster/clusterdeployments/test-cluster",
       uid: "f8014b27-4756-4c0e-83ea-42833be4bf52"
    },
    spec: {
       baseDomain: "dev02.test-chesterfield.com",
       clusterName: "test-cluster",
       installed: true,
       platform: {
          aws: {
             credentialsSecretRef: {
                name: "test-cluster-aws-creds"
             },
             region: "us-east-1"
          }
       },
       provisioning: {
          imageSetRef: {
             name: "img4.5.15-x86-64"
          },
          installConfigSecretRef: {
             name: "test-cluster-install-config"
          },
          sshPrivateKeySecretRef: {
             name: "test-cluster-ssh-private-key"
          }
       },
       pullSecretRef: {
          name: "test-cluster-pull-secret"
       }
    },
    status: {
       cliImage: "quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb",
       conditions: [],
       installerImage: "quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b",
       provisionRef: {
          name: "test-cluster-31-26h5q"
       }
    }
 }
const mockCertificateSigningRequestList: CertificateSigningRequestList = {
    apiVersion: CertificateSigningRequestListApiVersion,
    kind: CertificateSigningRequestListKind,
    metadata: { 
        selfLink: "/apis/certificates.k8s.io/v1beta1/certificatesigningrequests",
        resourceVersion: "48341234"
    },
    items: []
}

const clusterDeployment404 = {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"clusterdeployments.hive.openshift.io \"foobar\" not found","reason":"NotFound","details":{"name":"foobar","group":"hive.openshift.io","kind":"clusterdeployments"},"code":404}
const managedClusterInfo404 = {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"managedclusterinfos.internal.open-cluster-management.io \"foobar\" not found","reason":"NotFound","details":{"name":"foobar","group":"internal.open-cluster-management.io","kind":"managedclusterinfos"},"code":404}

const nockManagedClusterInfo = () => nockGet(mockManagedClusterInfo)
const nockClusterDeployment = () => nockGet(mockClusterDeployment)
const nockCertificateSigningRequestList = () => nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCertificateSigningRequestList, ['open-cluster-management.io/cluster-name=test-cluster'])

const nockManagedClusterInfo404 = () => nockGet(mockManagedClusterInfo, managedClusterInfo404, 404)
const nockClusterDeployment404 = () => nockGet(mockClusterDeployment, clusterDeployment404, 404)

describe('ClusterDetails page', () => {
    const Component = () => (
        <MemoryRouter initialEntries={['/cluster-management/cluster-management/clusters/test-cluster']}>
            <Switch>
                <Route path={NavigationPath.clusterDetails} component={ClusterDetails} />
            </Switch>
        </MemoryRouter>
    )
    test('renders', async () => {
        nockManagedClusterInfo()
        nockClusterDeployment()
        nockCertificateSigningRequestList()

        const { getByText } = render(<Component />)
        await waitFor(() => expect(getByText('cluster.details')).toBeInTheDocument())

        // Nodes tab
        userEvent.click(getByText('Nodes'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
        userEvent.click(getByText('Role'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
        userEvent.click(getByText('Region'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
    })
    test('renders error state', async () => {
        nockManagedClusterInfo404()
        nockClusterDeployment404()
        nockCertificateSigningRequestList()

        const { getByText } = render(<Component />)
        await waitFor(() => expect(getByText('Error')).toBeInTheDocument())
    })
})

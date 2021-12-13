/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { MemoryRouter, Route } from 'react-router-dom'
import { CIM } from 'openshift-assisted-ui-lib'

import { NavigationPath } from '../../../../../../NavigationPath'
import EditAICluster from './EditAICluster'
import { ClusterImageSet, ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../../../../resources'
import {
    agentClusterInstallsState,
    agentsState,
    clusterDeploymentsState,
    clusterImageSetsState,
    configMapsState,
    infraEnvironmentsState,
} from '../../../../../../atoms'
import { clickByText, waitForTestId, waitForText } from '../../../../../../lib/test-util'
import { mockAgents, mockConfigMapAI } from '../../CreateCluster/CreateCluster.sharedmocks'

const clusterName = 'my-cluster-name'
const baseDomain = 'base.domain.com'

export const mockInfraEnv1: CIM.InfraEnvK8sResource = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'InfraEnv',
    metadata: {
        labels: {
            'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
            networkType: 'dhcp',
        },
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        agentLabels: {
            'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
        },
        pullSecretRef: {
            name: `pullsecret-${clusterName}`,
        },
    },
    status: {
        agentLabelSelector: {
            matchLabels: {
                'infraenvs.agent-install.openshift.io': clusterName,
            },
        },
        conditions: [
            {
                lastTransitionTime: '2021-10-04T11:26:37Z',
                message: 'Image has been created',
                reason: 'ImageCreated',
                status: 'True',
                type: 'ImageCreated',
            },
        ],
        debugInfo: {},
        createdTime: '2021-11-10T13:00:00Z',
        isoDownloadURL: 'https://my.funny.download.url',
    },
}

const mockClusterImageSet: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'ocp-release48',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.15-x86_64',
    },
}

const mockClusterDeploymentAI: CIM.ClusterDeploymentK8sResource = {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterDeployment',
    metadata: {
        annotations: {
            'agentBareMetal-agentSelector/autoSelect': 'true',
        },
        labels: null,
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        baseDomain,
        clusterInstallRef: {
            group: 'extensions.hive.openshift.io',
            kind: 'AgentClusterInstall',
            name: clusterName,
            version: 'v1beta1',
        },
        clusterName,
        platform: {
            agentBareMetal: {
                agentSelector: {
                    matchLabels: null,
                },
            },
        },
        pullSecretRef: {
            name: `pullsecret-cluster-${clusterName}`,
        },
    },
}

const mockAgentClusterInstall: CIM.AgentClusterInstallK8sResource = {
    apiVersion: 'extensions.hive.openshift.io/v1beta1',
    kind: 'AgentClusterInstall',
    metadata: {
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        clusterDeploymentRef: { name: clusterName },
        holdInstallation: true,
        provisionRequirements: { controlPlaneAgents: 3 },
        imageSetRef: { name: 'ocp-release48' },
        networking: {
            clusterNetwork: [{ cidr: '10.128.0.0/14', hostPrefix: 23 }],
            serviceNetwork: ['172.30.0.0/16'],
        },
    },
}

const Component = () => {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(clusterImageSetsState, [mockClusterImageSet])
                snapshot.set(clusterDeploymentsState, [mockClusterDeploymentAI])
                snapshot.set(agentClusterInstallsState, [mockAgentClusterInstall])
                snapshot.set(agentsState, mockAgents)
                snapshot.set(infraEnvironmentsState, [mockInfraEnv1])
                snapshot.set(configMapsState, [mockConfigMapAI])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.editCluster]}>
                <Route
                    component={(props: any) => {
                        const newProps = { ...props }
                        newProps.match = props.match || { params: {} }
                        newProps.match.params.name = clusterName
                        newProps.match.params.namespace = clusterName
                        return <EditAICluster {...newProps} />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Edit AI Cluster', () => {
    test('can be rendered', async () => {
        render(<Component />)
        await new Promise((resolve) => setTimeout(resolve, 500))

        await waitForText('Cluster details', true)
        await waitForText('Cluster hosts')
        await waitForText('Installation details')

        await waitForTestId('form-static-openshiftVersion-field')
        await waitForText('OpenShift ocp-release48')

        await clickByText('Next')

        // Based on the setup, this is the AI flow
        await waitForText('Add hosts to an')

        /* TODO(mlibra): Subsequent steps should be covered by AI UI Lib tests. So far we can be sure that the AI UI component has been integrated into the ACM.

        const hostsNocks = [
          nockPatch(mockClusterDeploymentAI, [{"op":"replace","path":"/metadata/annotations","value":{}}]),
          nockPatch(mockAgent, mockAgent)]
        await clickByText('Next')
        await waitForNocks(hostsNocks)
        
        await waitForText('Host inventory')

        await waitForText('Save and install')
        */
        // screen.debug(undefined, -1)
    })
})

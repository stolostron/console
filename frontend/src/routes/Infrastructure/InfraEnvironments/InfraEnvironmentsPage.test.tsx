/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { CIM } from 'openshift-assisted-ui-lib'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'

import { infraEnvironmentsState } from '../../../atoms'
import { waitForTestId, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import InfraEnvironmentsPage from './InfraEnvironmentsPage'

export const infraEnvName = 'infra-env-name'

export const mockInfraEnv1: CIM.InfraEnvK8sResource = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'InfraEnv',
    metadata: {
        labels: {
            'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
            networkType: 'dhcp',
        },
        name: infraEnvName,
        namespace: infraEnvName,
    },
    spec: {
        agentLabels: {
            'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
        },
        pullSecretRef: {
            name: `pullsecret-${infraEnvName}`,
        },
    },
    status: {
        agentLabelSelector: {
            matchLabels: {
                'infraenvs.agent-install.openshift.io': infraEnvName,
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

export const mockPullSecret: CIM.SecretK8sResource = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: `pullsecret-${infraEnvName}`,
        namespace: infraEnvName,
        labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
    },
    data: {
        '.dockerconfigjson':
            'eyJhdXRocyI6eyJjbG91ZC5vcGVuc2hpZnQuY29tIjp7ImF1dGgiOiJiM0JsYlNLSVBQRUQiLCJlbWFpbCI6Im15QGVtYWlsLnNvbWV3aGVyZS5jb20ifX19',
    },
    type: 'kubernetes.io/dockerconfigjson',
}

const mockInfraEnvironments: CIM.InfraEnvK8sResource[] = [mockInfraEnv1]

const Component = () => {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(infraEnvironmentsState, mockInfraEnvironments)
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.infraEnvironments]}>
                <Route path={NavigationPath.infraEnvironments}>
                    <InfraEnvironmentsPage />
                </Route>
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Infrastructure Environments page', () => {
    test('can render', async () => {
        render(<Component />)

        await waitForText('Infrastructure environments', true)
        
        await waitForTestId('createInfraEnv')

        // is the infraEnv listed?
        await waitForText(infraEnvName, true)

    })
})

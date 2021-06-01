/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { ProgressStepBar } from './ProgressStepBar'
import { waitForText } from '../../../../lib/test-util'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState } from '../../../../atoms'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../../../../resources/cluster-curator'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'

const mockCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.posthookjob,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
        isManagedOpenShift: false,
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            kubeconfig: '',
            kubeadmin: '',
            installConfig: '',
        },
    },
    isHive: false,
    isManaged: true,
}

const clusterCurator1: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator1',
        namespace: 'default',
    },
    spec: {
        desiredCuration: 'install',
        install: {
            towerAuthSecret: 'ansible-credential-i',
            prehook: [
                {
                    name: 'test-job-i',
                },
            ],
        },
    },
}

describe('ProgressStepBar', () => {
    test('renders progress bar', async () => {
        const { container } = render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <RecoilRoot initializeState={(snapshot) => snapshot.set(clusterCuratorsState, [clusterCurator1])}>
                    <MemoryRouter>
                        <ProgressStepBar />
                    </MemoryRouter>
                </RecoilRoot>
            </ClusterContext.Provider>
        )
        console.log('checking container: ', container.innerHTML)
        await waitForText('status.stepbar.title')
        await waitForText('status.stepbar.subtitle')
        await waitForText('status.subtitle.progress')
        await waitForText('status.posthook.text')
        await waitForText('status.install.text')
    })
})

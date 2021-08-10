/* Copyright Contributors to the Open Cluster Management project */

import {
    AnsibleJob,
    AnsibleJobApiVersion,
    AnsibleJobKind,
    Cluster,
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    ClusterStatus,
} from '@open-cluster-management/resources'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ansibleJobState, clusterCuratorsState } from '../../../../../atoms'
import { clickByText, waitForCalled, waitForText } from '../../../../../lib/test-util'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ProgressStepBar } from './ProgressStepBar'

const mockCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.prehookjob,
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
    isCurator: false,
    owner: {},
}

const clusterCurator1: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-cluster',
        namespace: 'test-cluster',
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

const ansibleJob: AnsibleJob = {
    apiVersion: AnsibleJobApiVersion,
    kind: AnsibleJobKind,
    metadata: {
        name: 'ansible-job',
        namespace: 'test-cluster',
        annotations: {
            jobtype: 'prehook',
        },
    },
    status: {
        ansibleJobResult: {
            changed: true,
            failed: false,
            status: 'pending',
            url: '/ansible/url',
            finished: '2021-06-08T16:43:09.023018Z',
            started: '2021-06-08T16:43:01.853019Z',
        },
    },
}

describe('ProgressStepBar', () => {
    test('renders progress bar', async () => {
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <RecoilRoot initializeState={(snapshot) => snapshot.set(clusterCuratorsState, [clusterCurator1])}>
                    <MemoryRouter>
                        <ProgressStepBar />
                    </MemoryRouter>
                </RecoilRoot>
            </ClusterContext.Provider>
        )
        await waitForText('status.stepbar.title')
        await waitForText('status.stepbar.subtitle')
        await waitForText('status.subtitle.nojobs')
        await waitForText('status.subtitle.progress')
        await waitForText('status.posthook.text')
        await waitForText('status.install.text')
    })
    test('log link opens new window', async () => {
        window.open = jest.fn()
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <RecoilRoot
                    initializeState={(snapshot) => {
                        snapshot.set(clusterCuratorsState, [clusterCurator1])
                        snapshot.set(ansibleJobState, [ansibleJob])
                    }}
                >
                    <MemoryRouter>
                        <ProgressStepBar />
                    </MemoryRouter>
                </RecoilRoot>
            </ClusterContext.Provider>
        )
        await waitForText('status.stepbar.title')
        await waitForText('status.stepbar.subtitle')
        await waitForText('status.subtitle.nojobs')
        await waitForText('status.subtitle.progress')
        await waitForText('status.posthook.text')
        await waitForText('status.install.text')
        await clickByText('status.link.logs')
        await waitForCalled(window.open as jest.Mock)
    })
})

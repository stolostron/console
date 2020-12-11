import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockCreate, nockDelete, nockGet, nockList } from '../../../../lib/nock-util'
import {
    DiscoveredCluster,
    DiscoveredClusterApiVersion,
    DiscoveredClusterKind,
} from '../../../../resources/discovered-cluster'
import {
    KlusterletAddonConfig,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
} from '../../../../resources/klusterlet-add-on-config'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../../../resources/project'
import { Secret } from '../../../../resources/secret'
import DiscoveredClustersPage from '../../DiscoveredClusters/DiscoveredClusters'
import ImportClusterPage from './ImportCluster'

const mockProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: 'foobar' },
}


const mockSecretResponse: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'foobar-import',
        namespace: 'foobar',
    },
    data: {
        'crds.yaml': 'test',
        'import.yaml': 'test',
    },
}

describe('CreateCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/cluster-management/cluster-management/import-cluster']}>
                <Route path="/cluster-management/cluster-management/import-cluster">
                    <ImportClusterPage />
                </Route>
            </MemoryRouter>
        )
    }

    test('renders', () => {
        const { getByTestId } = render(<Component />)
        expect(getByTestId('import-cluster-form')).toBeInTheDocument()
        expect(getByTestId('clusterName-label')).toBeInTheDocument()
        expect(getByTestId('cloudLabel-label')).toBeInTheDocument()
        expect(getByTestId('environmentLabel-label')).toBeInTheDocument()
        expect(getByTestId('additionalLabels-label')).toBeInTheDocument()
        // expect(getByTestId('importModeManual')).toBeInTheDocument()
        expect(getByTestId('submit')).toBeInTheDocument()
    })
})

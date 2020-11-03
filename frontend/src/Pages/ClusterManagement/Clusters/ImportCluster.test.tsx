jest.mock('../../../lib/Project', () => ({ createProject: jest.fn() }))
jest.mock('../../../lib/ManagedCluster', () => ({ createManagedCluster: jest.fn() }))
jest.mock('../../../lib/KlusterletAddonConfig', () => ({ createKlusterletAddonConfig: jest.fn() }))

import React from 'react'
import {Route, MemoryRouter} from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { ImportClusterPage } from './ImportCluster'
import { createManagedCluster } from '../../../lib/ManagedCluster'
import { createKlusterletAddonConfig } from '../../../lib/KlusterletAddonConfig'
import { createProject } from '../../../lib/Project'

describe('ImportCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/cluster-management/clusters/import']}>
                <Route path='/cluster-management/clusters/import'>
                    <ImportClusterPage />
                </Route>
            </MemoryRouter>
        )
    }
    test('renders', () => {
        const { getByTestId } = render(<Component />)
        expect(getByTestId('import-cluster-form')).toBeInTheDocument()
    })
})

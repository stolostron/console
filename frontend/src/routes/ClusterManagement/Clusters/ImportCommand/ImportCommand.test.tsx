import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { nockGet } from '../../../../lib/nock-util'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'
import ImportCommandPage from './ImportCommand'

const mockSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: { name: 'foobar-import', namespace: 'foobar' },
    data: { 'crds.yaml': 'crd yaml', 'import.yaml': 'import yaml' },
    type: 'Opaque',
}

describe('ImportCommand', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/cluster-management/clusters/import/foobar']}>
                <Route path="/cluster-management/clusters/import/:clusterName">
                    <ImportCommandPage />
                </Route>
            </MemoryRouter>
        )
    }

    test('renders import command', async () => {
        const getSecretNock = nockGet(mockSecret)
        const { getByRole, getByTestId } = render(<Component />)
        expect(getByRole('progressbar')).toBeInTheDocument()
        await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByTestId('import-command')).toBeInTheDocument())
    })

    // test(
    //     'renders error state',
    //     async () => {
    //         nockGet(mockSecret, mockBadRequestStatus, 100)
    //         const { getByText } = render(<Component />)
    //         await waitFor(() => expect(getByText(mockBadRequestStatus.message)).toBeInTheDocument())
    //     },
    //     15 * 1000
    // )
})

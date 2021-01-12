import { render } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import CreateClusterPage from './CreateCluster'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
    withTranslation: () => (Component: any) => {
        Component.defaultProps = { ...Component.defaultProps, t: () => '' }
        return Component
    },
}))

describe('CreateCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={[NavigationPath.createCluster]}>
                <Route path={NavigationPath.createCluster}>
                    <CreateClusterPage />
                </Route>
            </MemoryRouter>
        )
    }

    test('renders', () => {
        const { getByTestId, getByText } = render(<Component />)
        expect(getByTestId('notifications')).toBeInTheDocument()
        expect(getByTestId('create-button-portal-id')).toBeInTheDocument()
        expect(getByTestId('eman')).toBeInTheDocument()
        expect(getByText('creation.ocp.cluster.details')).toBeInTheDocument()
        expect(getByTestId('main-creation.ocp.cluster.details')).toBeInTheDocument()
    })
})

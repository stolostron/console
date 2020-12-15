import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockCreate, nockDelete, nockGet, nockList } from '../../../../lib/nock-util'
import CreateClusterPage from './CreateCluster'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
      t: (key: string) => key,
  }),
  withTranslation: () => Component => {
    Component.defaultProps = { ...Component.defaultProps, t: () => "" };
    return Component;
  },
}));

describe('CreateCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/cluster-management/cluster-management/create-cluster']}>
                <Route path="/cluster-management/cluster-management/create-cluster">
                    <CreateClusterPage />
                </Route>
            </MemoryRouter>
        )
    }

    test('renders', () => {
        const { getByTestId } = render(<Component />)
//        expect(getByTestId('create-cluster-form')).toBeInTheDocument()
//        expect(getByTestId('clusterName-label')).toBeInTheDocument()
//        expect(getByTestId('cloudLabel-label')).toBeInTheDocument()
//        expect(getByTestId('environmentLabel-label')).toBeInTheDocument()
//        expect(getByTestId('additionalLabels-label')).toBeInTheDocument()
//        expect(getByTestId('submit')).toBeInTheDocument()
    })
})

/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AcmCatalogPageHeader } from './AcmCatalogPageHeader'

test('renders the catalog heading and navigates with breadcrumbs', () => {
  render(
    <MemoryRouter initialEntries={['/catalog']}>
      <Routes>
        <Route
          path="/catalog"
          element={
            <AcmCatalogPageHeader
              breadcrumbs={[{ label: 'Clusters', to: '/clusters' }, { label: 'Control plane' }]}
              title="Control plane type"
              description="Choose a control plane type."
            />
          }
        />
        <Route path="/clusters" element={<div>Cluster list</div>} />
      </Routes>
    </MemoryRouter>
  )

  expect(screen.getByRole('heading', { name: 'Control plane type' })).toBeInTheDocument()
  expect(screen.getByText('Choose a control plane type.')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Clusters'))
  expect(screen.getByText('Cluster list')).toBeInTheDocument()
})

/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { RecoilRoot } from 'recoil'
import { secretsState, multiClusterEnginesState } from '../../../../../../../atoms'
import { PrerequisitesPage } from './PrerequisitesPage'

describe('PrerequisitesPage', () => {
  const Component = () => (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, [] as any)
        snapshot.set(multiClusterEnginesState, [
          {
            spec: {
              overrides: {
                components: [],
              },
            },
          },
        ] as any)
      }}
    >
      <MemoryRouter>
        <PrerequisitesPage />
      </MemoryRouter>
    </RecoilRoot>
  )

  test('should render the page title', () => {
    render(<Component />)

    expect(screen.getByText('Red Hat OpenShift Service on AWS')).toBeInTheDocument()
  })

  test('should render the page description', () => {
    render(<Component />)

    expect(
      screen.getByText(
        'Deploy fully operational and managed Red Hat OpenShift clusters while leveraging the full breadth and depth of AWS using ROSA.'
      )
    ).toBeInTheDocument()
  })

  test('should render Learn more about ROSA link', () => {
    render(<Component />)

    expect(screen.getByText('Learn more about ROSA')).toBeInTheDocument()
  })

  test('should render service account prerequisites section', () => {
    render(<Component />)

    expect(screen.getByText('Service account prerequisites')).toBeInTheDocument()
  })

  test('should render AWS prerequisites section', () => {
    render(<Component />)

    expect(screen.getByText('AWS prerequisites')).toBeInTheDocument()
  })

  test('should render ROSA prerequisites section', () => {
    render(<Component />)

    expect(screen.getByText('ROSA prerequisites')).toBeInTheDocument()
  })

  test('should render the deployment method section', () => {
    render(<Component />)

    expect(screen.getByText('Deploy the cluster and set up access')).toBeInTheDocument()
    expect(screen.getByText('Select a deployment method')).toBeInTheDocument()
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<Component />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

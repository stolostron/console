/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  mockClusterSet,
  mockClusterSetBinding,
  mockManagedClusters,
  mockPlacements,
  mockPolicy,
} from '../../../routes/Governance/governance.sharedMocks'
import { PolicySetWizard } from './PolicySetWizard'
import { IResource } from '@patternfly-labs/react-form-wizard'

function TestPolicySetWizard() {
  return (
    <PolicySetWizard
      title="Testing the policy set wizard"
      namespaces={['argo-server-1']}
      policies={[mockPolicy as IResource]}
      placements={[mockPlacements as IResource]}
      placementRules={[]}
      clusters={mockManagedClusters}
      clusterSets={[mockClusterSet]}
      clusterSetBindings={[mockClusterSetBinding]}
      onSubmit={() => new Promise(() => {})}
      onCancel={() => {}}
    />
  )
}

describe('PolicySetWizard wizard', () => {
  test('can show correct cluster sets dropdown', async () => {
    const { container } = render(<TestPolicySetWizard />)

    const nameTextbox = screen.getByRole('textbox', { name: /name/i })
    userEvent.type(nameTextbox, 'test-policy')
    screen.getByText(/select the namespace/i).click()
    screen.getByRole('option', { name: /argo-server-1/i }).click()

    screen.getByRole('button', { name: /placement/i }).click()
    screen.getByRole('button', { name: /new placement/i }).click()
    await waitFor(() => screen.getByText(/select the cluster sets/i))
    const placementName = container.querySelector('#name-form-group #name')?.getAttribute('value')
    expect(placementName).toEqual('test-policy-placement')

    screen.getByText(/select the cluster sets/i).click()
    expect(screen.getByRole('button', { name: /create cluster set/i })).not.toBeNull()

    expect(screen.getByRole('checkbox', { name: /cluster-set-01/i })).not.toBeNull()
  })
})

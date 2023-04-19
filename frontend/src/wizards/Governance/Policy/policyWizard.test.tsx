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

import { Policy } from '../../../resources'
import { isExistingTemplateName, PolicyWizard } from './PolicyWizard'
import { IResource } from '@patternfly-labs/react-form-wizard'
import { waitForText } from '../../../lib/test-util'

describe('ExistingTemplateName', () => {
  test('should return false for non-existing name', () => {
    const result = isExistingTemplateName('test-template', mockPolicy)
    expect(result).toBe(false)
  })

  test('should return true for existing name', () => {
    const result = isExistingTemplateName('policy-set-with-1-placement-policy-1', mockPolicy)
    expect(result).toBe(true)
  })
})

function TestPolicyWizard() {
  return (
    <PolicyWizard
      title="Testing the policy wizard"
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

function TestPolicyWizardGK() {
  const mockPolicyGK = JSON.parse(JSON.stringify(mockPolicy[0])) as Policy
  mockPolicyGK.spec['policy-templates'] = [
    {
      objectDefinition: {
        apiVersion: 'templates.gatekeeper.sh/v1beta1',
        kind: 'ConstraintTemplate',
        metadata: { name: 'policy-set-with-1-placement-policy-1' },
        spec: {},
      },
    },
    {
      objectDefinition: {
        apiVersion: 'constraints.gatekeeper.sh/v1beta1',
        kind: 'K8sRequiredLabels',
        metadata: { name: 'policy-set-with-1-placement-policy-2' },
        spec: {},
      },
    },
  ]

  return (
    <PolicyWizard
      title="Testing the policy wizard"
      namespaces={['argo-server-1']}
      policies={[mockPolicyGK as IResource]}
      placements={[mockPlacements as IResource]}
      placementRules={[]}
      clusters={mockManagedClusters}
      clusterSets={[mockClusterSet]}
      clusterSetBindings={[mockClusterSetBinding]}
      onSubmit={() => new Promise(() => {})}
      onCancel={() => {}}
      resources={[mockPolicyGK as IResource]}
    />
  )
}

describe('Policy wizard', () => {
  test('can show correct cluster sets dropdown', async () => {
    const { container } = render(<TestPolicyWizard />)

    const nameTextbox = screen.getByRole('textbox', { name: /name/i })
    userEvent.type(nameTextbox, 'test-policy')
    screen.getByText(/select namespace/i).click()
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

  test('policy template customization is disabled for Gatekeeper policy', async () => {
    const { container } = render(<TestPolicyWizardGK />)
    screen.getByRole('button', { name: /policy templates/i }).click()

    await waitForText('Gatekeeper policy templates must be customized using the YAML editor.', true)
    expect(container.querySelector('#objectdefinition-spec-severity-form-group')).toBeNull()
    expect(container.querySelector('#objectdefinition-spec-remediationaction-form-group')).toBeNull()
  })
})

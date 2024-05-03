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
import { BrowserRouter as Router } from 'react-router-dom-v5-compat'
import { IResource } from '@patternfly-labs/react-form-wizard'
import { waitForText } from '../../../lib/test-util'
import { WizardSyncEditor } from '../../../routes/Governance/policies/CreatePolicy'

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
    <Router>
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
    </Router>
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
    <Router>
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
    </Router>
  )
}

function TestPolicyWizardOperatorPolicy() {
  const mockPolicyOperatorPlc = JSON.parse(JSON.stringify(mockPolicy[0])) as Policy
  mockPolicyOperatorPlc.spec['policy-templates'] = [
    {
      objectDefinition: {
        apiVersion: 'policy.open-cluster-management.io/v1beta1',
        kind: 'OperatorPolicy',
        metadata: { name: 'policy-set-with-1-placement-policy-1' },
        spec: {},
      },
    },
  ]

  return (
    <Router>
      <PolicyWizard
        title="Testing the policy wizard"
        namespaces={['argo-server-1']}
        policies={[mockPolicyOperatorPlc as IResource]}
        placements={[mockPlacements as IResource]}
        placementRules={[]}
        clusters={mockManagedClusters}
        clusterSets={[mockClusterSet]}
        clusterSetBindings={[mockClusterSetBinding]}
        onSubmit={() => new Promise(() => {})}
        onCancel={() => {}}
        resources={[mockPolicyOperatorPlc as IResource]}
        yamlEditor={() => <WizardSyncEditor />}
      />
    </Router>
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
    expect(screen.getByRole('button', { name: /Add cluster set/i })).not.toBeNull()

    expect(screen.getByRole('checkbox', { name: /cluster-set-01/i })).not.toBeNull()
  })

  test('policy template customization is disabled for Gatekeeper policy', async () => {
    const { container } = render(<TestPolicyWizardGK />)
    screen.getByRole('button', { name: /policy templates/i }).click()

    await waitForText('Gatekeeper policy templates must be customized using the YAML editor.', true)
    expect(container.querySelector('#objectdefinition-spec-severity-form-group')).toBeNull()
    expect(container.querySelector('#objectdefinition-spec-remediationaction-form-group')).toBeNull()
  })

  test('single namespace mode of OperatorPolicy', async () => {
    const { container } = render(<TestPolicyWizardOperatorPolicy />)
    screen.getByRole('button', { name: /policy templates/i }).click()

    // Wait for the policy wizard to load.
    await waitForText('An Operator policy creates operators on managed clusters.', true)

    // Verify that the "Installation Namespace" input sets both the subscription namespace and the operator group
    // target namespaces when in single namespace mode.
    const singleNSRadio = container.querySelector('#operator-single-namespace')
    expect(singleNSRadio).toBeTruthy()
    userEvent.click(singleNSRadio as Element)

    const nsInput = container.querySelector('#objectdefinition-spec-subscription-namespace')
    userEvent.type(nsInput as Element, 'my-namespace')

    // Open the YAML editor.
    const yamlCheckBox = screen.getByRole('checkbox', { name: /yaml/i }) as HTMLInputElement
    if (!yamlCheckBox.checked) {
      userEvent.click(yamlCheckBox)
    }

    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))

    expect(input).toHaveTextContent('subscription: namespace: my-namespace')
    expect(input).toHaveTextContent('operatorGroup: targetNamespaces: - my-namespace')

    // Setting all namespaces should wipe the operator group
    const allNSRadio = container.querySelector('#operator-all-namespaces')
    expect(allNSRadio).toBeTruthy()
    userEvent.click(allNSRadio as Element)

    await waitFor(() => {
      expect(input).toHaveTextContent('subscription: namespace: my-namespace')
      expect(input).not.toHaveTextContent('operatorGroup: targetNamespaces: - my-namespace')
    })
  })

  test('all namespace mode of OperatorPolicy', async () => {
    const { container } = render(<TestPolicyWizardOperatorPolicy />)
    screen.getByRole('button', { name: /policy templates/i }).click()

    // Wait for the policy wizard to load.
    await waitForText('An Operator policy creates operators on managed clusters.', true)

    const allNSRadio = container.querySelector('#operator-all-namespaces')
    expect(allNSRadio).toBeTruthy()
    userEvent.click(allNSRadio as Element)

    const nsInput = container.querySelector('#objectdefinition-spec-subscription-namespace')
    userEvent.type(nsInput as Element, 'my-namespace')

    // Open the YAML editor.
    const yamlCheckBox = screen.getByRole('checkbox', { name: /yaml/i }) as HTMLInputElement
    if (!yamlCheckBox.checked) {
      userEvent.click(yamlCheckBox)
    }

    await waitFor(() => {
      const input = screen.getByRole('textbox', {
        name: /monaco/i,
      }) as HTMLTextAreaElement

      expect(input).not.toHaveValue('')
    })

    const input = screen.getByRole('textbox', { name: /monaco/i }) as HTMLTextAreaElement

    expect(input).toHaveTextContent('subscription: namespace: my-namespace')
    expect(input).not.toHaveTextContent('operatorGroup: targetNamespaces: - my-namespace')
  })
})

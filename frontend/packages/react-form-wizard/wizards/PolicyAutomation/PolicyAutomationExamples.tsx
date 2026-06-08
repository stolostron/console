/* Copyright Contributors to the Open Cluster Management project */
import { useNavigate } from 'react-router-dom'
import { EditMode } from '../../src'
import { Catalog } from '../Catalog'
import { IPolicyAutomation, PolicyAutomationType } from '../common/resources/IPolicyAutomation'
import { onSubmit } from '../common/utils'
import { RouteE } from '../Routes'
import { PolicyAutomationWizard } from './PolicyAutomationWizard'

export function onCancel(navigate: (path: string) => void) {
  navigate(`./${RouteE.Wizards}`)
}

export function PolicyAutomationExamples() {
  const navigate = useNavigate()
  return (
    <Catalog
      title="Policy Automation Examples"
      breadcrumbs={[{ label: 'Example Wizards', to: RouteE.Wizards }, { label: 'Policy Automation Examples' }]}
      cards={[
        {
          title: 'Create policy automation',
          descriptions: ['Create a new policy automation.'],
          onClick: () => navigate(RouteE.CreatePolicyAutomation),
        },
        {
          title: 'Edit policy automation',
          descriptions: ['Edit a policy automation.'],
          onClick: () => navigate(RouteE.EditPolicyAutomation),
        },
      ]}
      onBack={() => navigate(RouteE.Wizards)}
    />
  )
}

export function CreatePolicyAutomation() {
  const navigate = useNavigate()
  return (
    <PolicyAutomationWizard
      breadcrumb={[
        { label: 'Example Wizards', to: RouteE.Wizards },
        { label: 'Policy AutomationExamples', to: RouteE.PolicyAutomation },
        { label: 'Create policy automation' },
      ]}
      title="Create policy automation"
      onSubmit={onSubmit}
      onCancel={() => onCancel(navigate)}
      policy={{
        metadata: { name: 'my-policy', namespace: 'my-namespace' },
      }}
      credentials={[
        {
          metadata: {
            name: 'my-ansible-creds',
            namespace: 'my-namespace',
            labels: {
              'cluster.open-cluster-management.io/type': 'ans',
            },
          },
        },
        {
          metadata: {
            name: 'my-bad-ansible-creds',
            namespace: 'my-namespace',
            labels: {
              'cluster.open-cluster-management.io/type': 'ans',
            },
          },
        },
      ]}
      createCredentialsCallback={() => window.open('http://google.com', '_blank')}
      resource={
        {
          ...PolicyAutomationType,
          metadata: { name: 'my-policy-policy-automation', namespace: 'my-namespace' },
          spec: {
            policyRef: 'my-policy',
            mode: 'once',
            automationDef: { name: '', secret: '', type: 'AnsibleJob' },
          },
        } as IPolicyAutomation
      }
      getAnsibleJobsCallback={async (credential) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (credential.metadata?.name === 'my-bad-ansible-creds') {
          return Promise.reject(new Error('Bad credentials'))
        } else {
          return Promise.resolve(['job1', 'job2'])
        }
      }}
      isAnsibleOperatorInstalled={true}
    />
  )
}

export function EditPolicyAutomation() {
  const navigate = useNavigate()
  return (
    <PolicyAutomationWizard
      breadcrumb={[
        { label: 'Example Wizards', to: RouteE.Wizards },
        { label: 'Policy AutomationExamples', to: RouteE.PolicyAutomation },
        { label: 'Edit policy automation' },
      ]}
      editMode={EditMode.Edit}
      title="Edit policy automation"
      onSubmit={onSubmit}
      onCancel={() => onCancel(navigate)}
      policy={{
        metadata: { name: 'my-policy', namespace: 'my-namespace' },
      }}
      credentials={[
        {
          metadata: {
            name: 'my-ansible-creds',
            namespace: 'my-namespace',
            labels: {
              'cluster.open-cluster-management.io/type': 'ans',
            },
          },
        },
        {
          metadata: {
            name: 'my-bad-ansible-creds',
            namespace: 'my-namespace',
            labels: {
              'cluster.open-cluster-management.io/type': 'ans',
            },
          },
        },
      ]}
      createCredentialsCallback={() => window.open('http://google.com', '_blank')}
      resource={
        {
          ...PolicyAutomationType,
          metadata: { name: 'my-policy-policy-automation', namespace: 'my-namespace' },
          spec: {
            policyRef: 'my-policy',
            mode: 'disabled',
            automationDef: {
              name: 'job1',
              secret: 'my-ansible-creds',
              type: 'AnsibleJob',
            },
          },
        } as IPolicyAutomation
      }
      getAnsibleJobsCallback={async (credential) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (credential.metadata?.name === 'my-bad-ansible-creds') {
          return Promise.reject(new Error('Bad credentials'))
        } else {
          return Promise.resolve(['job1', 'job2'])
        }
      }}
      isAnsibleOperatorInstalled={true}
    />
  )
}

/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  Secret,
  SecretApiVersion,
  SecretKind,
  SubscriptionOperator,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
} from '../../../resources'
import { Provider } from '../../../ui-components'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, namespacesState, secretsState, subscriptionOperatorsState } from '../../../atoms'
import { nockAnsibleTower, nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
  clickByPlaceholderText,
  clickByText,
  typeByPlaceholderText,
  waitForNock,
  waitForNotText,
  waitForTestId,
  waitForText,
} from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { AnsibleTowerJobTemplateList } from '../../../resources'
import AnsibleAutomationsFormPage from './AnsibleAutomationsForm'

const mockNamespaces: Namespace[] = [
  {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'namespace1' },
  },
]

const mockSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'ansible-test-secret',
    namespace: 'namespace-1',
    labels: {
      'cluster.open-cluster-management.io/type': Provider.ansible,
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
  stringData: {
    host: 'https://ansible-tower-web-svc-tower.com',
    token: 'abcd',
  },
}

function AddAnsibleTemplateTest(props: { subscriptions?: SubscriptionOperator[] }) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(namespacesState, mockNamespaces)
        snapshot.set(secretsState, [mockSecret])
        snapshot.set(clusterCuratorsState, [mockClusterCurator])
        snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.addAnsibleAutomation]}>
        <Route component={(props: any) => <AnsibleAutomationsFormPage {...props} />} />
      </MemoryRouter>
    </RecoilRoot>
  )
}

const mockClusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-curator',
    namespace: 'namespace-1',
    resourceVersion: '',
  },
  spec: {
    install: {
      towerAuthSecret: 'ansible-test-secret',
      prehook: [{ name: 'test-job-pre-install', extra_vars: {}, type: 'Job' }],
      posthook: [
        { name: 'test-job-post-install', extra_vars: {}, type: 'Job' },
        { name: 'test-job-pre-install-ii', extra_vars: {}, type: 'Workflow' },
      ],
      jobMonitorTimeout: 55,
    },
    upgrade: {
      towerAuthSecret: 'ansible-test-secret',
      prehook: [{ name: 'test-job-pre-upgrade', extra_vars: {}, type: 'Job' }],
      posthook: [{ name: 'test-job-post-upgrade', extra_vars: {}, type: 'Job' }],
      monitorTimeout: 555,
    },
  },
}

const mockAnsibleCredential = {
  towerHost: 'https://ansible-tower-web-svc-tower.com/api/v2/job_templates/',
  token: 'abcd',
}
const mockAnsibleCredentialWorkflow = {
  towerHost: 'https://ansible-tower-web-svc-tower.com/api/v2/workflow_job_templates/',
  token: 'abcd',
}

const mockTemplateList: AnsibleTowerJobTemplateList = {
  results: [
    {
      name: 'test-job-pre-install',
      type: 'job_template',
    },
    {
      name: 'test-job-post-install',
      type: 'job_template',
    },
    {
      name: 'test-job-pre-upgrade',
      type: 'job_template',
    },
    {
      name: 'test-job-post-upgrade',
      type: 'job_template',
    },
  ],
}

const mockTemplateWorkflowList: AnsibleTowerJobTemplateList = {
  results: [
    {
      name: 'test-job-pre-install-ii',
      type: 'workflow_job_template',
    },
  ],
}

const mockSubscriptionOperator: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'ansible-automation-platform-operator',
    namespace: 'ansible-automation-platform-operator',
  },
  status: {
    conditions: [
      {
        reason: 'AllCatalogSourcesHealthy',
        lastTransitionTime: '',
        message: '',
        type: 'CatalogSourcesUnhealthy',
        status: 'False',
      },
    ],
  },
  spec: {},
}

describe('add automation template page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('should create a curator template', async () => {
    render(<AddAnsibleTemplateTest />)

    // template information
    const ansibleJobNock = nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
    const ansibleWorkflowNock = nockAnsibleTower(mockAnsibleCredentialWorkflow, mockTemplateWorkflowList)
    await typeByPlaceholderText('Enter the name for the template', mockClusterCurator.metadata.name!)
    await clickByPlaceholderText('Select an existing Ansible credential')
    // Should show the modal wizard
    await clickByText('Add credential')
    // Credentials type
    await waitForTestId('credentialsType-input-toggle')
    await clickByText('Cancel', 1)

    await clickByPlaceholderText('Select an existing Ansible credential')
    await clickByText(mockSecret.metadata.name!)
    await clickByText('Next')
    await waitForNock(ansibleJobNock)
    await waitForNock(ansibleWorkflowNock)

    // install job templates
    await clickByText('Add an Ansible template', 0)
    await clickByPlaceholderText('Search or select a job template name', 0)
    await clickByText(mockTemplateList.results![0].name!, 0)
    await clickByText('Save')
    await clickByText('Add an Ansible template', 1)
    await clickByPlaceholderText('Search or select a job template name', 0)
    await clickByText(mockTemplateList.results![1].name!, 0)
    await clickByText('Save')

    // install workflow templates
    await clickByText('Add an Ansible template', 1)
    await clickByText('Workflow job template')
    await clickByPlaceholderText('Search or select a workflow job template name', 0)
    await clickByText(mockTemplateWorkflowList.results![0].name!, 0)
    await clickByText('Save')

    // install timeout
    userEvent.clear(
      screen.getByRole('spinbutton', {
        name: /timeout/i,
      })
    )
    userEvent.type(
      screen.getByRole('spinbutton', {
        name: /timeout/i,
      }),
      mockClusterCurator!.spec!.install!.jobMonitorTimeout!.toString(10)
    )

    await clickByText('Next')

    // upgrade templates
    await clickByText('Add an Ansible template', 0)
    await clickByText('Job template')
    await clickByPlaceholderText('Search or select a job template name', 0)
    await clickByText(mockTemplateList.results![2].name!, 0)
    await clickByText('Save')
    await clickByText('Add an Ansible template', 1)
    await clickByPlaceholderText('Search or select a job template name', 0)
    await clickByText(mockTemplateList.results![3].name!, 0)
    await clickByText('Save')

    // upgrade timeout
    userEvent.clear(
      screen.getByRole('spinbutton', {
        name: /timeout/i,
      })
    )
    userEvent.type(
      screen.getByRole('spinbutton', {
        name: /timeout/i,
      }),
      mockClusterCurator!.spec!.upgrade!.monitorTimeout!.toString(10)
    )

    await clickByText('Next')

    // add template
    const createNock = nockCreate(mockClusterCurator)
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should render warning when Ansible operator is not installed', async () => {
    render(<AddAnsibleTemplateTest />)
    waitForText('The Ansible Automation Platform Operator is required to use automation templates.')
  })

  it('should not render warning when Ansible operator is installed', async () => {
    render(<AddAnsibleTemplateTest subscriptions={[mockSubscriptionOperator]} />)
    waitForNotText('The Ansible Automation Platform Operator is required to use automation templates.')
  })
})

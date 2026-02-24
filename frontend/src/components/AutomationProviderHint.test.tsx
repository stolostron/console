/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, subscriptionOperatorsState } from '../atoms'
import { waitForNotText, waitForText } from '../lib/test-util'
import {
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  SubscriptionOperator,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
} from '../resources'
import { AutomationProviderHint } from './AutomationProviderHint'
import { nockIgnoreOperatorCheck } from '../lib/nock-util'

jest.mock('react-router-dom-v5-compat', () => {
  const originalModule = jest.requireActual('react-router-dom-v5-compat')
  return {
    __esModule: true,
    ...originalModule,
    useNavigate: () => jest.fn(),
  }
})

const automationTemplate: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-curator1',
    namespace: 'default',
  },
  spec: {
    install: {
      towerAuthSecret: 'ansible-credential-i',
      prehook: [
        {
          name: 'test-job-i',
        },
      ],
    },
  },
}

const automationTemplateWithWorkflow: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-curator2',
    namespace: 'default',
  },
  spec: {
    install: {
      prehook: [
        {
          name: 'test-job-i',
          type: 'Workflow',
        },
      ],
    },
  },
}

const aap_unhealthy: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'aap',
    namespace: 'ansible-automation-platform-operator',
  },
  spec: { name: 'ansible-automation-platform-operator' },
  status: {
    conditions: [
      {
        reason: 'SomethingWentWrong',
        lastTransitionTime: '',
        message: '',
        type: 'CatalogSourcesUnhealthy',
        status: 'True',
      },
    ],
  },
}

const aap: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'aap',
    namespace: 'ansible-automation-platform-operator',
  },
  spec: { name: 'ansible-automation-platform-operator' },
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
}

const aap_withWorkflowSupport: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'aap',
    namespace: 'ansible-automation-platform-operator',
  },
  spec: { name: 'ansible-automation-platform-operator' },
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
    installedCSV: 'aap-operator.v2.2.1+0.1668659261',
  },
}

function WrappedAutomationProviderHint(props: {
  automationTemplates?: ClusterCurator[]
  ansibleOperators?: SubscriptionOperator[]
  componentProps: React.ComponentProps<typeof AutomationProviderHint>
}) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(clusterCuratorsState, props.automationTemplates || [])
        snapshot.set(subscriptionOperatorsState, props.ansibleOperators || [])
      }}
    >
      <MemoryRouter>
        <AutomationProviderHint {...props.componentProps} />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('AutomationProviderHint', () => {
  beforeEach(() => {
    nockIgnoreOperatorCheck(true)
  })
  it('displays install alert when operator not installed', async () => {
    render(<WrappedAutomationProviderHint componentProps={{ component: 'alert' }} />)
    await waitForText('Operator required')
    await waitForText('Install the operator')
  })
  it('displays install alert when operator not healthy', async () => {
    render(<WrappedAutomationProviderHint ansibleOperators={[aap_unhealthy]} componentProps={{ component: 'alert' }} />)
    await waitForText('Operator required')
    await waitForText('Install the operator')
  })
  it('displays update alert when operator installed but workflow support not available', async () => {
    render(
      <WrappedAutomationProviderHint
        automationTemplates={[automationTemplate, automationTemplateWithWorkflow]}
        ansibleOperators={[aap]}
        componentProps={{ component: 'alert' }}
      />
    )
    await waitForText('Operator update required')
    await waitForText('View installed operators')
  })
  it('displays no alert when operator installed and workflow support not needed', async () => {
    render(
      <WrappedAutomationProviderHint
        automationTemplates={[automationTemplate]}
        ansibleOperators={[aap]}
        componentProps={{ component: 'alert' }}
      />
    )
    await waitForNotText('Operator required')
    await waitForNotText('Install the operator')
  })
  it('displays no alert when operatorNotRequired=true', async () => {
    render(
      <WrappedAutomationProviderHint
        automationTemplates={[automationTemplate]}
        componentProps={{ component: 'alert', operatorNotRequired: true }}
      />
    )
    await waitForNotText('Operator required')
    await waitForNotText('Install the operator')
  })
  it('displays update alert when operatorNotRequired=true', async () => {
    render(
      <WrappedAutomationProviderHint
        automationTemplates={[automationTemplateWithWorkflow]}
        ansibleOperators={[aap]}
        componentProps={{ component: 'alert', operatorNotRequired: true }}
      />
    )
    await waitForText('Operator update required')
    await waitForText('View installed operators')
  })
  it('displays no alert when operator installed and workflow support is available', async () => {
    render(
      <WrappedAutomationProviderHint
        automationTemplates={[automationTemplateWithWorkflow]}
        ansibleOperators={[aap_withWorkflowSupport]}
        componentProps={{ component: 'alert' }}
      />
    )
    await waitForNotText('Operator required')
    await waitForNotText('Install the operator')
  })
  it('displays update alert when workflowSupportRequired=true', async () => {
    render(
      <WrappedAutomationProviderHint
        automationTemplates={[automationTemplate]}
        ansibleOperators={[aap]}
        componentProps={{ component: 'alert', workflowSupportRequired: true }}
      />
    )
    await waitForText('Operator update required')
    await waitForText('View installed operators')
  })
  it('does not display update alert when workflowSupportRequired=false', async () => {
    render(
      <WrappedAutomationProviderHint
        automationTemplates={[automationTemplateWithWorkflow]}
        ansibleOperators={[aap]}
        componentProps={{ component: 'alert', workflowSupportRequired: false }}
      />
    )
    await waitForNotText('Operator required')
    await waitForNotText('Operator update required')
    await waitForNotText('Install the operator')
    await waitForNotText('View installed operators')
  })
  it('does not include title when rendered as hint', async () => {
    render(<WrappedAutomationProviderHint componentProps={{ component: 'hint' }} />)
    await waitForNotText('Operator required')
    await waitForText('Install the operator')
  })
})

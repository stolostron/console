/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, subscriptionOperatorsState } from '../../../atoms'
import { nockIgnoreOperatorCheck } from '../../../lib/nock-util'
import { PolicyAutomationWizard, PolicyAutomationWizardProps } from './PolicyAutomationWizard'

const mockGetwizardsynceditor = jest.fn()
const mockCreatecredentialscallback = jest.fn()
const mockOncancel = jest.fn()
const mockOnsubmit = jest.fn()
const mockGetansiblejobscallback = jest.fn().mockResolvedValue([{ name: 'job', id: '1', description: 'mock job' }])

describe('PolicyAutomationWizard tests', () => {
  const Component = (props: PolicyAutomationWizardProps) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(subscriptionOperatorsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyAutomationWizard {...props} />
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    nockIgnoreOperatorCheck()
  })

  test('create policy automation', async () => {
    const { container } = render(<Component {...props} />)

    await waitFor(() => expect(screen.getByPlaceholderText(/select the ansible credential/i)).toBeInTheDocument())

    userEvent.click(
      screen.getByRole('button', {
        name: /menu toggle/i,
      })
    )

    userEvent.click(
      screen.getByRole('option', {
        name: /test/i,
      })
    )

    await waitFor(() => expect(screen.getByPlaceholderText(/select the ansible job/i)).toBeInTheDocument())
    userEvent.click(screen.getByPlaceholderText(/select the ansible job/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /job/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /action/i,
      })
    )
    const key = container.querySelector('#key-1')
    if (key) {
      userEvent.type(key, 'key1')
    }
    const val = container.querySelector('#value-1')
    if (val) {
      userEvent.type(val, 'value1')
    }
    userEvent.click(
      screen.getByRole('button', {
        name: /plus/i,
      })
    )
    userEvent.type(
      screen.getByRole('spinbutton', {
        name: /input/i,
      }),
      '22'
    )
    userEvent.tab()
    userEvent.click(
      screen.getByRole('button', {
        name: /minus/i,
      })
    )

    userEvent.click(screen.getByPlaceholderText(/select the schedule/i))

    userEvent.click(
      screen.getByRole('option', {
        name: /everyevent/i,
      })
    )

    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /submit/i,
      })
    )
    //console.log(util.inspect(mockOnsubmit.mock.calls, { depth: null }))
    expect(mockOnsubmit).toHaveBeenCalledWith(submitted)
  })

  test('select prompt routes to correct template id', async () => {
    render(<Component {...props} />)
    await waitFor(() => expect(screen.getByPlaceholderText(/select the ansible credential/i)).toBeInTheDocument())

    userEvent.click(
      screen.getByRole('button', {
        name: /menu toggle/i,
      })
    )

    userEvent.click(
      screen.getByRole('option', {
        name: /test/i,
      })
    )

    await waitFor(() => expect(screen.getByPlaceholderText(/select the ansible job/i)).toBeInTheDocument())
    userEvent.click(screen.getByPlaceholderText(/select the ansible job/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /job/i,
      })
    )
    window.open = jest.fn()
    userEvent.click(screen.getByText('View selected template'))
    expect(window.open).toHaveBeenCalledWith('/#/templates/job_template/1')
  })
})

const props: PolicyAutomationWizardProps = {
  title: 'Create policy automation',
  policy: {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
      name: 'test',
      namespace: 'default',
    },
  },
  yamlEditor: mockGetwizardsynceditor,
  credentials: [
    {
      kind: 'Secret',
      apiVersion: 'v1',
      metadata: {
        name: 'test',
        namespace: 'default',
        labels: {
          'cluster.open-cluster-management.io/credentials': '',
          'cluster.open-cluster-management.io/type': 'ans',
        },
      },
    },
  ],
  createCredentialsCallback: mockCreatecredentialscallback,
  configMaps: [
    {
      metadata: {
        name: 'console-public',
        namespace: 'openshift-config-managed',
      },
      data: {
        consoleURL: 'https://console-openshift-console.apps.cs-aws-411-4mf5p.dev02.red-chesterfield.com',
      },
      kind: 'ConfigMap',
      apiVersion: 'v1',
    },
  ],
  resource: {
    kind: 'PolicyAutomation',
    apiVersion: 'policy.open-cluster-management.io/v1beta1',
    metadata: {
      name: 'test-policy-automation',
      namespace: 'default',
    },
    spec: {
      policyRef: 'test',
      mode: 'once',
      automationDef: {
        name: '',
        secret: '',
        type: 'AnsibleJob',
      },
    },
  },
  onCancel: mockOncancel,
  onSubmit: mockOnsubmit,
  getAnsibleJobsCallback: mockGetansiblejobscallback,
}

const submitted = {
  kind: 'PolicyAutomation',
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  metadata: { name: 'test-policy-automation', namespace: 'default' },
  spec: {
    policyRef: 'test',
    mode: 'everyEvent',
    automationDef: {
      name: 'job',
      secret: 'test',
      type: 'AnsibleJob',
      extra_vars: { key1: 'value1' },
      policyViolationsLimit: 121,
    },
  },
}

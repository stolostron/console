/* Copyright Contributors to the Open Cluster Management project */
import { PolicyAutomationWizard, PolicyAutomationWizardProps } from './PolicyAutomationWizard'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clusterCuratorsState, subscriptionOperatorsState } from '../../../atoms'

const mockGetwizardsynceditor = jest.fn()
const mockCreatecredentialscallback = jest.fn()
const mockOncancel = jest.fn()
const mockOnsubmit = jest.fn()
const mockGetansiblejobscallback = jest.fn().mockResolvedValue(['job'])

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
  })

  test('create policy automation', async () => {
    const { container } = render(<Component {...props} />)

    await waitFor(() => expect(screen.getByText(/select the ansible credential/i)).toBeInTheDocument())

    userEvent.click(
      screen.getByRole('button', {
        name: /options menu/i,
      })
    )

    userEvent.click(
      screen.getByRole('option', {
        name: /test/i,
      })
    )

    await waitFor(() => expect(screen.getByText(/select the ansible job/i)).toBeInTheDocument())
    userEvent.click(screen.getByText(/select the ansible job/i))
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

    const dropdown = container.querySelector('#pf-select-toggle-id-107')
    if (dropdown) {
      userEvent.click(dropdown)
    }

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
    {
      metadata: {
        name: 'insight-content-data',
        namespace: 'open-cluster-management',
      },
      data: {
        ADMIN_ACK:
          '{"HasReason":true,"description":"Upgrades are blocked because a manual acknowledgment for to-be-removed APIs has not been provided","generic":"4.8.14 introduced a requirement that an administrator provide a manual acknowledgment before\\nthe cluster can be upgraded from OpenShift Container Platform 4.8 to 4.9.\\nThis is to help prevent issues after upgrading to OpenShift Container Platform 4.9,\\nwhere APIs that have been removed are still in use by workloads, tools, or other components\\nrunning on or interacting with the cluster. Administrators must evaluate their cluster for any\\nAPIs in use that will be removed and migrate the affected components to use the appropriate new API version.\\nAfter this is done, the administrator can provide the administrator acknowledgment.","impact":"OpenShift Upgrade Failure","likelihood":4,"more_info":"","publish_date":"2021-09-24 16:00:00","reason":"The cluster is running {{=pydata.version}}, upgrades from OpenShift Container Platform 4.8 to 4.9 are blocked because the administrator has not provided a manual acknowledgment.","resolution":"{{?pydata.api_removed}}\\nRed Hat recommends that you evaluate your cluster for removed APIs and migrate instances of removed APIs. Please refer to the [OpenShift Documentation]({{?pydata.managed_cluster}}https://access.redhat.com/solutions/6351332{{??}}https://access.redhat.com/articles/6329921{{?}}) for the steps.\\n{{??}}\\nIf you have completed [the evaluation of removed APIs]({{?pydata.managed_cluster}}https://access.redhat.com/solutions/6351332{{??}}https://access.redhat.com/articles/6329921{{?}}) and your cluster is ready to upgrade to OpenShift Container Platform 4.9, please run the following command to provide the administrator acknowledgment.\\n~~~\\n$ oc -n openshift-config patch cm admin-acks --patch \'{\\"data\\":{\\"ack-4.8-kube-1.22-api-removals-in-4.9\\":\\"true\\"}}\' --type=merge\\n~~~\\n{{?}}\\n","status":"active","summary":"","tags":["service_availability","openshift","osd_customer"],"total_risk":3}',
        API_NOT_ENABLED_ON_GCP:
          '{"HasReason":true,"description":"Cloud Credential Operator becomes degraded on GCP when the GCP project does not enable all required APIs","generic":"Google recently modified the GCP API to list permissions associated with `roles/compute.loadBalancerAdmin`.\\nThis list now includes the permissions `networksecurity.*` and `certificatemanager.*`.\\nThe Cloud Credential Operator (CCO) will check whether the APIs are enabled. \\nIf the GCP Project has the APIs as disabled, CCO will error out and not complete processing the CredentialsRequest. \\nThe CCO degradation on this cluster is most likely caused by the APIs not being enabled.","impact":"OpenShift Upgrade Failure","likelihood":3,"more_info":"For more in-depth information please check the Bugzilla bug [2021731](https://bugzilla.redhat.com/show_bug.cgi?id=2021731).","publish_date":"2021-11-15 16:00:00","reason":"This OpenShift cluster is running on GCP with the version {{=pydata.version}}.\\nThe Cloud Credential Operator (CCO) is **degraded** on the reason **CredentialsFailing**.\\n{{?pydata.pod_details}}\\nThis condition is caused by the following APIs not being enabled.\\n{{~pydata.apis: api}}\\n- {{=api}}\\n{{~}}\\n\\nThe CCO checks whether the APIs are enabled. If the GCP Project has the APIs as disabled, CCO will error out and not complete processing the CredentialsRequest.\\n\\nFound issue pods:\\n{{~pydata.pod_details: pod}}\\n- Pod:  **{{=pod[\\"pod_name\\"]}}**\\n- Message: {{=pod[\\"message\\"]}}\\n{{~}}\\n{{??}}\\nThis condition is most likely caused by the following APIs not being enabled.\\n- networksecurity.googleapis.com\\n- certificatemanager.googleapis.com\\n\\nThe CCO checks whether the APIs are enabled. If the GCP Project has the APIs as disabled, CCO will error out and not complete processing the CredentialsRequest.\\n{{?}}\\n\\n","resolution":"Red Hat recommends that you upgrade to {{=pydata.fixed_version}} or above to avoid this issue. Please refer to the [OpenShift Documentation](https://docs.openshift.com/container-platform/4.{{=pydata.minor_version}}/updating/updating-cluster-between-minor.html) for the steps.\\n\\n**Alternatively**, a workaround is to enable the issue APIs by following the steps in [KCS 6505391](https://access.redhat.com/solutions/6505391).","status":"active","summary":"","tags":["service_availability","openshift","operator","gcp"],"total_risk":2}',
        API_NOT_ENABLED_ON_GCP_INCIDENT:
          '{"HasReason":true,"description":"Cloud Credential Operator becomes degraded on GCP when APIs are not enabled due a GCP API change","generic":"Google recently modified the GCP API to list permissions associated with `roles/compute.loadBalancerAdmin`.\\nThis list now includes the permissions `networksecurity.*` and `certificatemanager.*`.\\nThe Cloud Credential Operator (CCO) will check whether the APIs are enabled. \\nIf the GCP Project has the APIs as disabled, CCO will error out and not complete processing the CredentialsRequest. \\n","impact":"OpenShift Upgrade Failure","likelihood":4,"more_info":"For more in-depth information please check the Bugzilla bug [2021731](https://bugzilla.redhat.com/show_bug.cgi?id=2021731).","publish_date":"2021-11-15 16:00:00","reason":"This OpenShift cluster is running on GCP with the version {{=pydata.version}}.\\nThe Cloud Credential Operator (CCO) is **degraded** on the reason **CredentialsFailing**.\\n{{?pydata.pod_details}}\\nThis condition is caused by the following APIs not being enabled.\\n{{~pydata.apis: api}}\\n- {{=api}}\\n{{~}}\\n\\nThe CCO checks whether the APIs are enabled. If the GCP Project has the APIs as disabled, CCO will error out and not complete processing the CredentialsRequest.\\n\\nFound issue pods:\\n{{~pydata.pod_details: pod}}\\n- Pod:  **{{=pod[\\"pod_name\\"]}}**\\n- Message: {{=pod[\\"message\\"]}}\\n{{~}}\\n{{??}}\\nThis condition is most likely caused by the following APIs not being enabled.\\n- networksecurity.googleapis.com\\n- certificatemanager.googleapis.com\\n\\nThe CCO checks whether the APIs are enabled. If the GCP Project has the APIs as disabled, CCO will error out and not complete processing the CredentialsRequest.\\n{{?}}\\n\\n","resolution":"Red Hat recommends that you upgrade to {{=pydata.fixed_version}} or above to avoid this issue. Please refer to the [OpenShift Documentation](https://docs.openshift.com/container-platform/4.{{=pydata.minor_version}}/updating/updating-cluster-between-minor.html) for the steps.\\n\\n**Alternatively**, a workaround is to enable the issue APIs by following the steps in [KCS 6505391](https://access.redhat.com/solutions/6505391).","status":"active","summary":"","tags":["service_availability","openshift","operator","gcp"],"total_risk":3}',
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

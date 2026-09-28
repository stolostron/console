/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { ClusterStatus } from '../../../../resources/utils'
import { DeleteExternalResourceModal } from './DeleteExternalResourceModal'
import { clickElement } from '~/lib/test-util'

window.open = jest.fn()

test('renders DeleteExternalResourceModal correctly', async () => {
  const { getByText } = render(
    <DeleteExternalResourceModal
      open={true}
      close={() => {}}
      resource={{
        apiVersion: 'v1',
        kind: 'Pod',
        name: 'testPod',
        namespace: 'test-ns',
        cluster: 'test-cluster',
        managedHub: 'leaf-hub',
      }}
      hubCluster={{
        name: 'leaf-hub',
        namespace: 'leaf-hub',
        consoleURL: 'https://leaf-hub.com',
        uid: '',
        status: ClusterStatus.ready,
        hasAutomationTemplate: false,
        hive: {
          isHibernatable: false,
        },
        isHive: false,
        isManaged: true,
        isCurator: false,
        isHostedCluster: false,
        isRegionalHubCluster: true,
        owner: {},
        isSNOCluster: false,
        isHypershift: false,
      }}
    />
  )
  expect(
    getByText(
      'Delete is not supported for managed cluster resources in the global context. To delete this resource, please navigate to the details page on the managed hub.'
    )
  ).toBeInTheDocument()

  // verify click launch button
  const launchButton = getByText('Launch to cluster')
  expect(launchButton).toBeTruthy()
  await clickElement(launchButton)
  expect(window.open).toHaveBeenCalledWith(
    'https://leaf-hub.com/multicloud/search/resources?cluster%3Dtest-cluster%26kind%3DPod%26namespace%3Dtest-ns%26name%3DtestPod',
    '_blank'
  )
})

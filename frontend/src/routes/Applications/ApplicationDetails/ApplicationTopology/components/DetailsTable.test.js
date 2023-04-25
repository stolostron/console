/* Copyright Contributors to the Open Cluster Management project */

import DetailsTable from './DetailsTable'
import { render, screen } from '@testing-library/react'
import { waitForText } from '../../../../../lib/test-util'

const t = (string) => {
  return string
}

describe('DetailsTable', () => {
  const node = {
    name: '',
    namespace: '',
    type: 'deployment',
    id: 'member--member--deployable--member--clusters----deployment----',
    uid: 'member--member--deployable--member--clusters----deployment----',
    specs: {
      isDesign: false,
      raw: {
        metadata: {
          name: '',
          namespace: '',
        },
        kind: 'Deployment',
        name: '',
        namespace: '',
        resources: [
          {
            group: 'apps',
            health: {
              status: 'Healthy',
            },
            kind: 'Deployment',
            name: 'pause-deploy',
            namespace: 'feng-argo-perf',
            status: 'Synced',
            version: 'v1',
          },
          {
            group: 'apps',
            health: {
              status: 'Healthy',
            },
            kind: 'Deployment',
            name: 'pause-deploy2',
            namespace: 'feng-argo-perf',
            status: 'Synced',
            version: 'v1',
          },
          {
            group: 'apps',
            health: {
              status: 'Healthy',
            },
            kind: 'Deployment',
            name: 'pause-deploy3',
            namespace: 'feng-argo-perf',
            status: 'Synced',
            version: 'v1',
          },
        ],
        resourceCount: 3,
      },
      clustersNames: ['local-cluster'],
      parent: {
        clusterId: 'member--clusters--',
      },
      resources: [
        {
          group: 'apps',
          health: {
            status: 'Healthy',
          },
          kind: 'Deployment',
          name: 'pause-deploy',
          namespace: 'feng-argo-perf',
          status: 'Synced',
          version: 'v1',
        },
        {
          group: 'apps',
          health: {
            status: 'Healthy',
          },
          kind: 'Deployment',
          name: 'pause-deploy2',
          namespace: 'feng-argo-perf',
          status: 'Synced',
          version: 'v1',
        },
        {
          group: 'apps',
          health: {
            status: 'Healthy',
          },
          kind: 'Deployment',
          name: 'pause-deploy3',
          namespace: 'feng-argo-perf',
          status: 'Synced',
          version: 'v1',
        },
      ],
      resourceCount: 3,
      searchClusters: [
        {
          ClusterCertificateRotated: 'True',
          HubAcceptedManagedCluster: 'True',
          ManagedClusterConditionAvailable: 'True',
          ManagedClusterImportSucceeded: 'True',
          ManagedClusterJoined: 'True',
          _hubClusterResource: 'true',
          _uid: 'cluster__local-cluster',
          addon:
            'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=true; observability-controller=false; search-collector=false; work-manager=true',
          apigroup: 'internal.open-cluster-management.io',
          cluster: 'local-cluster',
          consoleURL: 'https://console-openshift-console.apps.app-aws-411ga-hub-bwrqq.dev06.red-chesterfield.com',
          cpu: '24',
          created: '2023-01-19T20:00:18Z',
          kind: 'Cluster',
          kind_plural: 'managedclusterinfos',
          kubernetesVersion: 'v1.24.0+9546431',
          label:
            'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=e3ecf1d1-c597-4ee4-9b67-443ff16a723e; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.11.0; openshiftVersion-major=4; openshiftVersion-major-minor=4.11; velero.io/exclude-from-backup=true; vendor=OpenShift',
          memory: '97666536Ki',
          name: 'local-cluster',
          nodes: '3',
        },
      ],
      deploymentModel: {
        'pause-deploy3-local-cluster-feng-argo-perf': [
          {
            _clusterNamespace: '',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/2c3f0bee-5a61-4e89-b580-8e01272c0695',
            apigroup: 'apps',
            apiversion: 'v1',
            available: '1',
            cluster: 'local-cluster',
            created: '2023-01-19T21:07:37Z',
            current: '1',
            desired: '1',
            kind: 'Deployment',
            kind_plural: 'deployments',
            label: 'app=pause-app; app.kubernetes.io/instance=feng-argo-perf',
            name: 'pause-deploy3',
            namespace: 'feng-argo-perf',
            ready: '1',
            resStatus: '1/1',
            pulse: 'green',
          },
        ],
        'pause-deploy2-local-cluster-feng-argo-perf': [
          {
            _clusterNamespace: '',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/3ece64f1-0158-4c4a-9a05-707ad67bfea2',
            apigroup: 'apps',
            apiversion: 'v1',
            available: '1',
            cluster: 'local-cluster',
            created: '2023-01-19T21:07:37Z',
            current: '1',
            desired: '1',
            kind: 'Deployment',
            kind_plural: 'deployments',
            label: 'app=pause-app; app.kubernetes.io/instance=feng-argo-perf',
            name: 'pause-deploy2',
            namespace: 'feng-argo-perf',
            ready: '1',
            resStatus: '1/1',
            pulse: 'blocked',
          },
        ],
        'pause-deploy-local-cluster-feng-argo-perf': [
          {
            _clusterNamespace: '',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/55c66fdf-a06e-4480-985a-9814089e0d87',
            apigroup: 'apps',
            apiversion: 'v1',
            available: '1',
            cluster: 'local-cluster',
            created: '2023-01-19T21:07:37Z',
            current: '1',
            desired: '1',
            kind: 'Deployment',
            kind_plural: 'deployments',
            label: 'app=pause-app; app.kubernetes.io/instance=feng-argo-perf',
            name: 'pause-deploy',
            namespace: 'feng-argo-perf',
            ready: '1',
            resStatus: '1/1',
            pulse: 'yellow',
          },
        ],
      },
      pulse: 'green',
      shapeType: 'deployment',
    },
  }

  beforeEach(async () => {
    render(<DetailsTable id="details-view-table" node={node} t={t} handleOpen={jest.fn} />)

    await waitForText('pause-deploy')
  })

  it('renders as expected', () => {
    expect(screen.getAllByText('feng-argo-perf').length).toBe(3)
  })
})

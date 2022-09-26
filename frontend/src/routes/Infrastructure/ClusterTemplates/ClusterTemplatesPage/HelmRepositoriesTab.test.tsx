/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { waitForTestId } from '../../../../lib/test-util';
import { useHelmRepositories } from '../hooks/useHelmRepositories';
import { useHelmRepositoryIndex } from '../hooks/useHelmRepositoryIndex';
import { HelmChartRepository, HelmRepoIndex, HelmRepoIndexChartEntry } from '../types';
import HelmRepositoriesTab from './HelmRepositoriesTab';

const helmRepositoryMock1 = {
  kind: 'HelmChartRepository',
  apiVersion: 'helm.openshift.io/v1beta1',
  metadata: {
    creationTimestamp: '2022-09-07T08:25:26Z',
    labels: {
      'clustertemplates.openshift.io/helm-repo': 'true',
    },
    name: 'cluster-templates-repo',
    resourceVersion: '234290256',
    uid: 'b98ef4e9-869a-47fc-9b71-eb955ce288b2',
  },
  spec: {
    connectionConfig: {
      url: 'https://rawagner.github.io/helm-demo/index.yaml',
    },
  },
};

const helmRepositoriesListMock: HelmChartRepository[] = [helmRepositoryMock1];

const hiveTemplateRepoCharts: HelmRepoIndexChartEntry = {
  annotations: {
    'cluster-template': 'true',
  },
  apiVersion: 'v2',
  appVersion: '1.16.0',
  created: '2022-09-22T13:22:44.76705777+02:00',
  description: 'A Helm chart for Kubernetes',
  digest: '4d200d352b4181c34605aa53faad6bdc113baa5ce4e645e002985d2a137737c1',
  name: 'hive-template',
  type: 'application',
  urls: ['https://rawagner.github.io/helm-demo/index.yaml/hive-template-0.1.0.tgz'],
  version: '0.1.0',
};

const hypershiftTemplateRepoCharts: HelmRepoIndexChartEntry = {
  annotations: {
    'cluster-template': 'true',
  },
  apiVersion: 'v2',
  appVersion: '1.16.0',
  created: '2022-09-22T13:22:44.768087445+02:00',
  description: 'A Helm chart for Kubernetes',
  digest: 'a47cf46a2551bbec37fd7973fc8fe4b66e9fe320c564f9de218a942f1969074b',
  name: 'hypershift-template',
  type: 'application',
  urls: ['https://rawagner.github.io/helm-demo/index.yaml/hypershift-template-0.1.0.tgz'],
  version: '0.1.0',
};

const helmRepositoryIndexMock: HelmRepoIndex = {
  apiVersion: 'v1',
  entries: {
    'hive-template--cluster-templates-repo': [hiveTemplateRepoCharts],
    'hypershift-template--cluster-templates-repo': [hypershiftTemplateRepoCharts],
  },
  generated: '2022-09-23T14:42:54.245748+02:00',
};

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MockComponent = require('../mocks/MockComponent').default;
  return {
    VirtualizedTable: MockComponent,
  };
});

jest.mock('@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s', () => ({
  k8sBasePath: 'https://k8s-base-path/',
}));
jest.mock('../hooks/useHelmRepositories');
jest.mock('../hooks/useHelmRepositoryIndex');

(useHelmRepositories as jest.Mock).mockReturnValue([helmRepositoriesListMock, true, undefined]);
(useHelmRepositoryIndex as jest.Mock).mockReturnValue([helmRepositoryIndexMock, true, undefined]);

describe('HelmRepositoritesTab', () => {
  test('renders the table', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <HelmRepositoriesTab />
        </MemoryRouter>
      </RecoilRoot>,
    );
    await waitForTestId('helm-repositories-table');
  });
});

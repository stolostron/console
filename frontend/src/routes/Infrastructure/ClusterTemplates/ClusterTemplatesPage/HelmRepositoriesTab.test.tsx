/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { waitForTestId, waitForText } from '../../../../lib/test-util';
import { useClusterTemplates } from '../hooks/useClusterTemplates';
import { useHelmRepositories } from '../hooks/useHelmRepositories';
import { HelmChartRepository, HelmRepoIndex, HelmRepoIndexChartEntry } from '../types';
import HelmRepositoriesTab, { HelmRepoRow, RowContext } from './HelmRepositoriesTab';
import * as useHelmRepositoryIndex from '../hooks/useHelmRepositoryIndex';
import userEvent from '@testing-library/user-event';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';

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

const HCRModelMock: K8sModel & { path: string } = {
  kind: 'HelmChartRepository',
  namespaced: false,
  verbs: ['delete', 'deletecollection', 'get', 'list', 'patch', 'create', 'update', 'watch'],
  label: 'Helm Chart Repository',
  plural: 'helmchartrepositories',
  apiVersion: 'v1beta1',
  abbr: 'HCR',
  apiGroup: 'helm.openshift.io',
  labelPlural: 'Helm Chart Repositories',
  path: 'helmchartrepositories',
  id: 'helmchartrepository',
  crd: true,
};

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MockComponent = require('../mocks/MockComponent').default;
  return {
    ResourceLink: MockComponent,
    useK8sModel: jest.fn().mockReturnValue([HCRModelMock]),
    k8sDelete: jest.fn(),
  };
});
jest.mock('@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s', () => ({
  k8sBasePath: 'https://k8s-base-path/',
}));

jest.mock('../hooks/useHelmRepositories');
jest.mock('../hooks/useClusterTemplates');
(useHelmRepositories as jest.Mock).mockReturnValue([helmRepositoriesListMock, true, undefined]);
(useClusterTemplates as jest.Mock).mockReturnValue([[], true, undefined]);
jest
  .spyOn(useHelmRepositoryIndex, 'useHelmRepositoryIndex')
  .mockReturnValue([helmRepositoryIndexMock, true, undefined]);

describe('HelmRepositoritesTab', () => {
  test('renders the helm repositories table', async () => {
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

describe('HelmRepoRow', () => {
  test('Repo deletion action and modal button', async () => {
    render(
      <RowContext.Provider
        value={{
          helmRepoIndexResult: [helmRepositoryIndexMock, true, undefined],
          clusterTemplatesResult: [[], true, undefined],
        }}
      >
        <HelmRepoRow obj={helmRepositoryMock1} />
      </RowContext.Provider>,
    );
    await userEvent.click(screen.getByTestId('repo-actions-toggle'));
    await waitForText('Delete HelmChartRepository');
    await userEvent.click(screen.getByText('Delete HelmChartRepository'));
    await waitForText('Are you sure you want to delete?');
    await userEvent.click(screen.getByText('Delete'));
    expect(screen.queryByText('Delete HelmChartRepository')).toBeNull();
  });
  test('Repo deletion modal close button closes the dialog', async () => {
    render(
      <RowContext.Provider
        value={{
          helmRepoIndexResult: [helmRepositoryIndexMock, true, undefined],
          clusterTemplatesResult: [[], true, undefined],
        }}
      >
        <HelmRepoRow obj={helmRepositoryMock1} />
      </RowContext.Provider>,
    );
    await userEvent.click(screen.getByTestId('repo-actions-toggle'));
    await waitForText('Delete HelmChartRepository');
    await userEvent.click(screen.getByText('Delete HelmChartRepository'));
    await waitForText('Are you sure you want to delete?');
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete HelmChartRepository')).toBeNull();
  });
  test('Repo deletion modal x button closes the dialog', async () => {
    render(
      <RowContext.Provider
        value={{
          helmRepoIndexResult: [helmRepositoryIndexMock, true, undefined],
          clusterTemplatesResult: [[], true, undefined],
        }}
      >
        <HelmRepoRow obj={helmRepositoryMock1} />
      </RowContext.Provider>,
    );
    await userEvent.click(screen.getByTestId('repo-actions-toggle'));
    await waitForText('Delete HelmChartRepository');
    await userEvent.click(screen.getByText('Delete HelmChartRepository'));
    await waitForText('Are you sure you want to delete?');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Delete HelmChartRepository')).toBeNull();
  });
});

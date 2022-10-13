/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { waitForTestId, waitForText } from '../../../../lib/test-util';
import { useClusterTemplates } from '../hooks/useClusterTemplates';
import { ClusterTemplate } from '../types';
import { useClusterTemplateInstances } from '../hooks/useClusterTemplateInstances';
import ClusterTemplatesTab, { ClusterTemplateRow } from './ClusterTemplatesTab';

const clusterTemplateMock1: ClusterTemplate = {
  kind: 'ClusterTemplate',
  apiVersion: 'clustertemplate.openshift.io/v1alpha1',
  metadata: {
    creationTimestamp: '2022-09-23T06:53:05Z',
    generation: 1,
    name: 'hive-bm',
    resourceVersion: '312732574',
    uid: '806afad3-d18f-4e68-81e8-29df93273814',
  },
  spec: {
    clusterSetup: {
      pipeline: {
        name: 'argocd-pipeline',
        namespace: 'cluster-pipelines',
      },
    },
    cost: 10,
    helmChartRef: {
      name: 'hypershift-template',
      repository: 'cluster-templates-repo',
      version: '0.1.0',
    },
    properties: [],
  },
};

const clusterTemplatesListMock: ClusterTemplate[] = [clusterTemplateMock1];

const clusterTemplateModelMock = {
  kind: 'ClusterTemplate',
  namespaced: false,
  verbs: ['delete', 'deletecollection', 'get', 'list', 'patch', 'create', 'update', 'watch'],
  shortNames: ['ct', 'cts'],
  label: 'ClusterTemplate',
  plural: 'clustertemplates',
  apiVersion: 'v1alpha1',
  abbr: 'CT',
  apiGroup: 'clustertemplate.openshift.io',
  labelPlural: 'ClusterTemplates',
  path: 'clustertemplates',
  id: 'clustertemplate',
  crd: true,
};

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MockComponent = require('../mocks/MockComponent').default;
  return {
    ResourceLink: MockComponent,
    useK8sModel: jest.fn().mockReturnValue([clusterTemplateModelMock]),
    k8sDelete: jest.fn(),
  };
});

jest.mock('../hooks/useClusterTemplates');
jest.mock('../hooks/useClusterTemplateInstances');
(useClusterTemplates as jest.Mock).mockReturnValue([clusterTemplatesListMock, true, undefined]);
(useClusterTemplateInstances as jest.Mock).mockReturnValue([[], true, undefined]);

describe('ClusterTemplatesTab', () => {
  test('renders the cluster templates table', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <ClusterTemplatesTab />
        </MemoryRouter>
      </RecoilRoot>,
    );
    await waitForTestId('cluster-templates-table');
  });
});

describe('ClusterTemplateRow', () => {
  test('Cluster template deletion action and modal button', async () => {
    render(<ClusterTemplateRow obj={clusterTemplateMock1} />);
    await userEvent.click(screen.getByTestId('cluster-template-actions-toggle'));
    await waitForText('Delete template');
    await userEvent.click(screen.getByText('Delete template'));
    await waitForText('Are you sure you want to delete?');
    await userEvent.click(screen.getByText('Delete'));
    expect(screen.queryByText('Delete cluster template')).toBeNull();
  });
  test('Cluster template deletion modal close button closes the dialog', async () => {
    render(<ClusterTemplateRow obj={clusterTemplateMock1} />);
    await userEvent.click(screen.getByTestId('cluster-template-actions-toggle'));
    await waitForText('Delete template');
    await userEvent.click(screen.getByText('Delete template'));
    await waitForText('Are you sure you want to delete?');
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete cluster template')).toBeNull();
  });
  test('Repo deletion modal x button closes the dialog', async () => {
    render(<ClusterTemplateRow obj={clusterTemplateMock1} />);
    await userEvent.click(screen.getByTestId('cluster-template-actions-toggle'));
    await waitForText('Delete template');
    await userEvent.click(screen.getByText('Delete template'));
    await waitForText('Are you sure you want to delete?');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Delete cluster template')).toBeNull();
  });
});

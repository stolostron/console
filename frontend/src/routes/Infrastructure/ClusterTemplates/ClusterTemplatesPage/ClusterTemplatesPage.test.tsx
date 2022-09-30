/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import ClusterTemplatesPage from './ClusterTemplatesPage';
import { useClusterTemplates } from '../hooks/useClusterTemplates';
import { useHelmRepositoriesCount } from '../hooks/useHelmRepositories';
import { waitForText } from '../../../../lib/test-util';

jest.mock('@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s', () => ({
  k8sBasePath: 'https://k8s-base-path/',
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MockComponent = require('../mocks/MockComponent').default;
  return {
    HorizontalNav: MockComponent,
    ListPageCreateDropdown: MockComponent,
    ListPageHeader: MockComponent,
    NavPage: MockComponent,
  };
});

jest.mock('../hooks/useClusterTemplates');
jest.mock('../hooks/useHelmRepositories');
(useClusterTemplates as jest.Mock).mockReturnValue([[], true, undefined]);
(useHelmRepositoriesCount as jest.Mock).mockReturnValue(0);

describe('ClusterTemplatesPage', () => {
  test('redirects to templates tab by default', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <ClusterTemplatesPage />
        </MemoryRouter>
      </RecoilRoot>,
    );
    waitForText('Cluster templates');
  });
});

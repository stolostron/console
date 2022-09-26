/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { RecoilRoot } from 'recoil';
import ClusterTemplatesPage from './ClusterTemplatesPage';
import { useClusterTemplates } from '../hooks/useClusterTemplates';
import { useHelmRepositoriesCount } from '../hooks/useHelmRepositories';

jest.mock('@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s', () => ({
  k8sBasePath: 'https://k8s-base-path/',
}));
// jest.mock('@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s-ref', () => ({
//   getReference: jest.fn(() => 'test-cluster-reference'),
// }));

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
  test.skip('redirects to templates tab by default', async () => {
    const history = createMemoryHistory();
    history.push('/k8s/cluster/test-cluster-reference');
    render(
      <RecoilRoot>
        <Router history={history}>
          <ClusterTemplatesPage />
        </Router>
      </RecoilRoot>,
    );
    expect(history.location.pathname).toEqual('/k8s/cluster/test-cluster-reference/~tabs');
  });
});

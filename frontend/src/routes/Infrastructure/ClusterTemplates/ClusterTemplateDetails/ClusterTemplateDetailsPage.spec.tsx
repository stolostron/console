/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react';
import { Route, Router, Switch } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import ClusterTemplateDetailsPage from './ClusterTemplateDetailsPage';
import { useClusterTemplate } from '../hooks/useClusterTemplates';
import exampleTemplate from '../mocks/clusterTemplateExample.json';

jest.mock('../hooks/useClusterTemplates');
jest.mock('../hooks/useQuotas', () => {
  return {
    useQuotas: jest.fn().mockReturnValue([[], true, null]),
  };
});
jest.mock('../hooks/useClusterTemplateInstances', () => {
  return {
    useClusterTemplateInstances: () => [[], true, null],
  };
});

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return {
    ResourceLink: jest.fn().mockImplementation(({ name }) => <div>{name}</div>),
  };
});

const renderTemplatesPage = () => {
  const history = createMemoryHistory();
  history.push(
    '/k8s/cluster/clustertemplate.openshift.io~v1alpha1~ClusterTemplate/cluster-template-example',
  );
  return render(
    <Router history={history}>
      <Switch>
        <Route
          component={ClusterTemplateDetailsPage}
          path="/k8s/cluster/clustertemplate.openshift.io~v1alpha1~ClusterTemplate/:name"
        />
      </Switch>
    </Router>,
  );
};

describe('Cluster template details page', () => {
  it('should show loading state while loading', async () => {
    useClusterTemplate.mockReturnValue([undefined, false, null]);
    const { getByText } = renderTemplatesPage();
    expect(getByText('Loading')).toBeInTheDocument();
  });

  it('should show error when useClusterTemplate failed', async () => {
    useClusterTemplate.mockReturnValue([undefined, false, new Error('test error')]);
    const { getByTestId } = renderTemplatesPage();
    expect(getByTestId('error')).toBeInTheDocument();
  });

  it('should show the four sections when template is loaded', async () => {
    useClusterTemplate.mockReturnValue([exampleTemplate, true, null]);
    const { container, getByTestId } = renderTemplatesPage();
    const details = {
      ['Template name']: exampleTemplate.metadata?.name,
      ['HELM chart name']: exampleTemplate.spec.helmChartRef.name,
      ['HELM chart repository']: exampleTemplate.spec.helmChartRef.repository,
      ['HELM chart version']: exampleTemplate.spec.helmChartRef.version,
      ['Description']:
        exampleTemplate.metadata?.annotations['clustertemplates.openshift.io/description'],
      ['Infrastructure type']:
        exampleTemplate.metadata?.labels['clustertemplates.openshift.io/infra'],
      ['Location']: exampleTemplate.metadata?.labels['clustertemplates.openshift.io/location'],
      ['Vendor']: 'Custom template',
      ['Cost estimation']: `${exampleTemplate.spec.cost} / Per use`,
      ['Template uses']: '0 cluster',
      ['Pipeline']: 'argocd-pipeline',
    };
    for (const [key, value] of Object.entries(details)) {
      expect(container.querySelector(`[id='${key} label']`)).toHaveTextContent(key);
      expect(container.querySelector(`[id='${key} value']`)).toHaveTextContent(value);
    }
    expect(container.querySelector(`[id='Labels label']`)).toHaveTextContent('Labels');
    for (const [key, value] of Object.entries(exampleTemplate.metadata.labels)) {
      expect(container.querySelector(`[id='Labels value']`)).toHaveTextContent(`${key}=${value}`);
    }
    expect(getByTestId('instanceYaml')).toHaveTextContent(/Download the YAML file/);
    expect(getByTestId('quotas')).toHaveTextContent(/No quota set yet/);
    expect(getByTestId('uses')).toHaveTextContent(/No clusters associated with this template yet/);
  });
});

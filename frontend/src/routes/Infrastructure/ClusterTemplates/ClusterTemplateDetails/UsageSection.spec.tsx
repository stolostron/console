/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react';
import UsageSection from './UsageSection';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import clusterTemplate from '../mocks/clusterTemplateExample.json';
import instances from '../mocks/clusterTemplateInstances.json';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return {
    ResourceLink: jest.fn().mockImplementation(({ name }) => <div id="resource-name">{name}</div>),
    useK8sWatchResource: jest.fn(),
  };
});

const renderUsageSection = async () => {
  return render(<UsageSection clusterTemplate={clusterTemplate}></UsageSection>);
};

describe('Cluster template details page usage section', () => {
  it.skip('should show loading state while loading instances', async () => {
    useK8sWatchResource.mockReturnValue([[], false, null]);
    const { getByTestId } = await renderUsageSection();
    expect(getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it.skip('should show error when load instances returns an error', async () => {
    useK8sWatchResource.mockReturnValue([undefined, true, new Error('test error')]);
    const { getByTestId } = await renderUsageSection();
    expect(getByTestId('error')).toBeInTheDocument();
  });

  it('should show instances of current template', async () => {
    useK8sWatchResource.mockReturnValue([instances, true, null]);
    const { getByTestId, container } = await renderUsageSection();
    const expected = [
      {
        name: 'hypershift-cluster-0',
        namespace: 'ns',
        statusIcon: 'failed-icon',
        statusLabel: 'Failed',
      },
      {
        name: 'hypershift-cluster-1',
        namespace: 'ns1',
        statusIcon: 'success-icon',
        statusLabel: 'Ready',
      },
      {
        name: 'hypershift-cluster-2',
        namespace: 'ns1',
        statusIcon: 'running-icon',
        statusLabel: 'Pending',
      },
      {
        name: 'hypershift-cluster-3',
        namespace: 'ns',
        statusIcon: 'running-icon',
        statusLabel: 'Post install configuration',
      },
      {
        name: 'hypershift-cluster-4',
        namespace: 'ns',
        statusIcon: 'running-icon',
        statusLabel: 'Installing',
      },
    ];
    expect(getByTestId('cluster-template-instances-table')).toBeInTheDocument();
    for (let i = 0; i < expected.length; ++i) {
      expect(
        container.querySelector(
          `[data-index='${i}'][id='cluster-template-instance-row'] [id=name]`,
        ),
      ).toHaveTextContent(expected[i].name);
      expect(
        container.querySelector(
          `[data-index='${i}'][id='cluster-template-instance-row'] [id=namespace]`,
        ),
      ).toHaveTextContent(expected[i].namespace);
      expect(
        container.querySelector(
          `[data-index='${i}'][id='cluster-template-instance-row'] [id=status]`,
        ),
      ).toHaveTextContent(expected[i].statusLabel);
      expect(
        container.querySelector(
          `[data-index='${i}'][id='cluster-template-instance-row'] [id=status] [id='${expected[i].statusIcon}']`,
        ),
      ).toBeInTheDocument();
    }
  });
});

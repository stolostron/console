/* Copyright Contributors to the Open Cluster Management project */

import { K8sGroupVersionKind } from '@openshift-console/dynamic-plugin-sdk';
import { render } from '@testing-library/react';
import { clusterTemplateQuotaGVK, roleBindingGVK } from '../constants';
import QuotasSection from './QuotaSection';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import importedQuotas from '../mocks/quotas.json';
import clusterTemplate from '../mocks/clusterTemplateExample.json';
import roleBindings from '../mocks/roleBindings.json';
import { ClusterTemplateQuota } from '../types';

const quotas = importedQuotas as ClusterTemplateQuota[];
const quotasInTemplate = quotas.filter((quota) =>
  (quota.spec?.allowedTemplates?.map((templateData) => templateData.name) || []).includes(
    clusterTemplate.metadata.name,
  ),
);

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return {
    ResourceLink: jest.fn().mockImplementation(({ name }) => <div id="resource-name">{name}</div>),
    useK8sWatchResource: jest.fn(),
  };
});

const renderQuotasSection = async () => {
  return render(<QuotasSection clusterTemplate={clusterTemplate}></QuotasSection>);
};

describe('Cluster template details page quotas section', () => {
  it('should show loading state while loading', async () => {
    useK8sWatchResource.mockReturnValue([[], false, null]);
    const { getByTestId } = await renderQuotasSection();
    expect(getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('should show error when load quotas returns an error', async () => {
    useK8sWatchResource.mockReturnValue([undefined, true, new Error('test error')]);
    const { getByTestId } = await renderQuotasSection();
    expect(getByTestId('error')).toBeInTheDocument();
  });

  it('should show quotas in table and no users and groups when no cluster template role binding was found', async () => {
    useK8sWatchResource.mockImplementation(
      ({ groupVersionKind }: { groupVersionKind: K8sGroupVersionKind }) => {
        if (groupVersionKind.kind === clusterTemplateQuotaGVK.kind) {
          return [quotas, true, null];
        }
        if (groupVersionKind.kind === roleBindingGVK.kind) {
          return [[], true, null];
        }
        throw `unexpected kind ${groupVersionKind.kind}`;
      },
    );
    const { container, getByTestId } = await renderQuotasSection();
    expect(getByTestId('quotas-table')).toBeInTheDocument();

    for (let i = 0; i < quotasInTemplate.length; ++i) {
      const quota = quotas[i];
      const rowSelector = `[data-index='${i}'][id=quotas-table-row]`;
      expect(container.querySelector(`${rowSelector} [id=name]`)).toHaveTextContent(
        quota.metadata?.name || '',
      );
      expect(container.querySelector(`${rowSelector} [id=namespace]`)).toHaveTextContent(
        quota.metadata?.namespace || '',
      );
      expect(container.querySelector(`${rowSelector} [id=user-management]`)).toHaveTextContent(
        `0 user, 0 group`,
      );
      expect(container.querySelector(`${rowSelector} [id=cost]`)).toHaveTextContent(
        quota.spec?.budget ? `${quota.status?.budgetSpent || 0} / ${quota.spec?.budget}` : '-',
      );
    }
  });
  it('should show data in user management for first quota when has cluster template RoleBinding for that namespace', async () => {
    useK8sWatchResource.mockImplementation(
      ({
        groupVersionKind,
        namespace,
      }: {
        groupVersionKind: K8sGroupVersionKind;
        namespace?: string;
      }) => {
        if (groupVersionKind.kind === clusterTemplateQuotaGVK.kind) {
          return [quotas, true, null];
        }
        if (groupVersionKind.kind === roleBindingGVK.kind) {
          return [roleBindings.filter((rb) => rb.metadata.namespace === namespace), true, null];
        }
        throw `unexpected kind ${groupVersionKind.kind}`;
      },
    );
    const { container } = await renderQuotasSection();
    expect(
      container.querySelector(`[data-index='0'][id='quotas-table-row'] [id='user-management']`),
    ).toHaveTextContent(`3 user, 2 group`);
    expect(
      container.querySelector(`[data-index='1'][id='quotas-table-row'] [id='user-management']`),
    ).toHaveTextContent(`0 user, 0 group`);
  });
});

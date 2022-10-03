/* Copyright Contributors to the Open Cluster Management project */

import { ClusterTemplateQuota } from '../types';

import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import React from 'react';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateQuotaGVK, namespaceGVK } from '../constants';
import { useTranslation } from '../../../../lib/acm-i18next';
import {
  ClusterTemplateQuotaAccessSummary,
  ClusterTemplateQuotaCostSummary,
} from './clusterTemplateQuotaComponents';

type TableColumn = {
  title: string;
  id: string;
};

const getTableColumns = (t: TFunction): TableColumn[] => [
  {
    title: t('Name'),
    id: 'name',
  },
  {
    title: t('Namespace'),
    id: 'namespace',
  },
  {
    title: t('User management'),
    id: 'user-management',
  },
  {
    title: t('Cost'),
    id: 'cost',
  },
];

const QuotaRow: React.FC<{
  quota: ClusterTemplateQuota;
  columns: TableColumn[];
  index: number;
}> = ({ quota, columns, index }) => {
  return (
    <Tr data-index={index} id="quotas-table-row">
      <Td dataLabel={columns[0].title} id="name">
        <ResourceLink
          groupVersionKind={clusterTemplateQuotaGVK}
          name={quota.metadata?.name}
          namespace={quota.metadata?.namespace}
          hideIcon
        />
      </Td>
      <Td dataLabel={columns[1].title} id="namespace">
        <ResourceLink groupVersionKind={namespaceGVK} name={quota.metadata?.namespace} hideIcon />
      </Td>
      <Td dataLabel={columns[2].title} id="user-management">
        <ClusterTemplateQuotaAccessSummary quota={quota} />
      </Td>
      <Td dataLabel={columns[3].title} id="cost">
        <ClusterTemplateQuotaCostSummary quota={quota} />
      </Td>
    </Tr>
  );
};

const ClusterTemplateQuotasTable: React.FC<{
  quotas: ClusterTemplateQuota[];
}> = ({ quotas }) => {
  const { t } = useTranslation();
  const columns = getTableColumns(t);
  return (
    <TableComposable variant="compact" id="quotas-table">
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th key={column.id}>{column.title}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {quotas.map((quota, index) => (
          <QuotaRow quota={quota} columns={columns} index={index} />
        ))}
      </Tbody>
    </TableComposable>
  );
};

export default ClusterTemplateQuotasTable;

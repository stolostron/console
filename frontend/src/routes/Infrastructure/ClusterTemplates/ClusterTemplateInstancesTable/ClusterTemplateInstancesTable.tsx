/* Copyright Contributors to the Open Cluster Management project */

import { ClusterTemplateInstance } from '../types';

import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import React from 'react';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateInstanceGVK, namespaceGVK } from '../constants';
import { useTranslation } from '../../../../lib/acm-i18next';
import ClusterTemplateInstanceStatus from './ClusterTemplateInstanceStatus';

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
    title: t('Status'),
    id: 'status',
  },
];

const InstanceRow: React.FC<{
  instance: ClusterTemplateInstance;
  columns: TableColumn[];
  index: number;
}> = ({ instance, columns, index }) => {
  return (
    <Tr data-index={index} id="cluster-template-instance-row">
      <Td dataLabel={columns[0].title} id="name">
        <ResourceLink
          groupVersionKind={clusterTemplateInstanceGVK}
          name={instance.metadata?.name}
          namespace={instance.metadata?.namespace}
          hideIcon
        />
      </Td>
      <Td dataLabel={columns[1].title} id="namespace">
        <ResourceLink
          groupVersionKind={namespaceGVK}
          name={instance.metadata?.namespace}
          hideIcon
        />
      </Td>
      <Td dataLabel={columns[2].title} id="status">
        <ClusterTemplateInstanceStatus instance={instance} />
      </Td>
    </Tr>
  );
};

const ClusterTemplateInstanceTable: React.FC<{
  instances: ClusterTemplateInstance[];
}> = ({ instances }) => {
  const { t } = useTranslation();
  const columns = getTableColumns(t);
  return (
    <TableComposable variant="compact" id="cluster-template-instances-table">
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th key={column.id}>{column.title}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {instances.map((instance, index) => (
          <InstanceRow instance={instance} columns={columns} index={index} />
        ))}
      </Tbody>
    </TableComposable>
  );
};

export default ClusterTemplateInstanceTable;

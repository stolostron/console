/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import { ClusterTemplate } from '../types';
import ClusterTemplateInstancesTable from '../ClusterTemplateInstancesTable/ClusterTemplateInstancesTable';
import { useClusterTemplateInstances } from '../hooks/useClusterTemplateInstances';
import { EmptyState, Title, EmptyStateBody } from '@patternfly/react-core';

import { useTranslation } from '../../../../lib/acm-i18next';
import TableLoader from '../helpers/TableLoader';

const UsageEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <Title size="lg" headingLevel="h4">
        {t('No clusters associated with this template yet')}
      </Title>
      <EmptyStateBody>{t('Clusters created using this template will appear here.')}</EmptyStateBody>
    </EmptyState>
  );
};

const UsageSection: React.FC<{ clusterTemplate: ClusterTemplate }> = ({ clusterTemplate }) => {
  const [instances, loaded, loadError] = useClusterTemplateInstances(
    clusterTemplate.metadata?.name,
  );
  return (
    <TableLoader loaded={loaded} error={loadError}>
      {instances.length === 0 ? (
        <UsageEmptyState />
      ) : (
        <ClusterTemplateInstancesTable instances={instances}></ClusterTemplateInstancesTable>
      )}
    </TableLoader>
  );
};

export default UsageSection;

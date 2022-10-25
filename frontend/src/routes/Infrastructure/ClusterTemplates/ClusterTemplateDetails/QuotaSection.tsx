/* Copyright Contributors to the Open Cluster Management project */
import { Alert, EmptyState, EmptyStateBody, Stack, StackItem, Title } from '@patternfly/react-core';
import React from 'react';
import { useTranslation } from '../../../../lib/acm-i18next';
import ClusterTemplateQuotasTable from '../ClusterTemplateQuotas/ClusterTemplateQuotasTable';
import TableLoader from '../helpers/TableLoader';
import { useQuotas } from '../hooks/useQuotas';
import { ClusterTemplate, ClusterTemplateQuota } from '../types';

const QuotasEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <Title size="lg" headingLevel="h4">
        {t('No quota set yet')}
      </Title>
      <EmptyStateBody>
        {t(
          'Configure the template access permissions to see here who uses this template and what cost has spent.',
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};

const _QuotasSection: React.FC<{ quotas: ClusterTemplateQuota[] }> = ({ quotas }) => {
  const { t } = useTranslation();

  if (quotas.length === 0) {
    return <QuotasEmptyState />;
  }
  return (
    <Stack hasGutter>
      <StackItem>
        <Alert
          variant="info"
          title={t(
            'This template may be accessible to more users than those listed below. Global permissions are granted to Kube-admin. Check out each namespace to know who can access this template. ',
          )}
          isInline
        />
      </StackItem>
      <StackItem>
        <ClusterTemplateQuotasTable quotas={quotas} />
      </StackItem>
    </Stack>
  );
};

const QuotasSection: React.FC<{ clusterTemplate: ClusterTemplate }> = ({ clusterTemplate }) => {
  const [quotas, loaded, error] = useQuotas(clusterTemplate.metadata?.name || '');
  return (
    <TableLoader loaded={loaded} error={error}>
      <_QuotasSection quotas={quotas}></_QuotasSection>
    </TableLoader>
  );
};

export default QuotasSection;

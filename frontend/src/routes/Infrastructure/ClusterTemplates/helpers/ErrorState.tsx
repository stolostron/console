/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon, Title } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from '../../../../lib/acm-i18next';

export type ErrorStateProps = {
  error: unknown;
  errorId?: string;
  errorTitle?: string;
  errorMessage?: string;
};

const ErrorState = ({ errorId, errorTitle, errorMessage }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <EmptyState id={errorId ?? 'error'}>
      <EmptyStateIcon icon={ExclamationCircleIcon} />
      <Title size="lg" headingLevel="h4">
        {errorTitle ?? t('Something went wrong')}
      </Title>
      {errorMessage && <EmptyStateBody>{errorMessage}</EmptyStateBody>}
    </EmptyState>
  );
};

export default ErrorState;

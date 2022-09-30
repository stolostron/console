/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Skeleton,
  Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from '../../../../lib/acm-i18next';

type TableLoaderProps = {
  children: React.ReactNode;
  loaded?: boolean;
  error?: unknown;
  errorId?: string;
  errorTitle?: string;
  errorMessage?: string;
};

function TableLoader({
  loaded = false,
  error,
  errorId,
  errorTitle,
  errorMessage,
  children,
}: TableLoaderProps) {
  const { t } = useTranslation();
  if (!loaded) {
    return (
      <div id="table-skeleton">
        <Skeleton />
        <br />
        <Skeleton />
        <br />
        <Skeleton />
        <br />
        <Skeleton />
        <br />
        <Skeleton />
        <br />
        <Skeleton />
      </div>
    );
  }
  if (error) {
    return (
      <EmptyState id={errorId ?? 'error'}>
        <EmptyStateIcon icon={ExclamationCircleIcon} />
        <Title size="lg" headingLevel="h4">
          {errorTitle ?? t('Something went wrong')}
        </Title>
        {errorMessage && <EmptyStateBody>{errorMessage}</EmptyStateBody>}
      </EmptyState>
    );
  }
  return <>{children}</>;
}

export default TableLoader;

/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import ErrorState, { ErrorStateProps } from './ErrorState';

type TableLoaderProps = {
  children: React.ReactNode;
  loaded?: boolean;
  error?: unknown;
} & ErrorStateProps;

function TableLoader({ loaded = false, error, children, ...errorStateProps }: TableLoaderProps) {
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
    return <ErrorState {...errorStateProps} />;
  }
  return <>{children}</>;
}

export default TableLoader;

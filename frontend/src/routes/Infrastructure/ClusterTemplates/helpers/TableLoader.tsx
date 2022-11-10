/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import ErrorState from './ErrorState';

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
      <ErrorState
        error={error}
        errorId={errorId}
        errorTitle={errorTitle}
        errorMessage={errorMessage}
      ></ErrorState>
    );
  }
  return <>{children}</>;
}

export default TableLoader;

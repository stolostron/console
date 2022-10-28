/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import isString from 'lodash/isString';

export const getNavLabelWithCount = (label: string, count?: number) => {
  if (count === undefined) {
    return label;
  }
  return `${label} (${count})`;
};

type LoadingHelperProps = {
  isLoaded: boolean;
  error?: unknown;
  children: React.ReactNode;
};

export const LoadingHelper = ({ isLoaded, error, children }: LoadingHelperProps) => {
  if (!isLoaded) return <Skeleton />;
  if (error) return <>-</>;
  return <>{children}</>;
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (isString(error)) {
    return error;
  }
  return 'Unexpected error';
};

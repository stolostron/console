/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import { Skeleton } from '@patternfly/react-core';

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

/* Copyright Contributors to the Open Cluster Management project */
import { load } from 'js-yaml';
import * as React from 'react';
import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import { HelmRepoIndex } from '../types';

export const useHelmRepositoryIndex = (): [HelmRepoIndex | undefined, boolean, unknown] => {
  const [repoIndex, setRepoIndex] = React.useState<HelmRepoIndex>();
  const [repoLoaded, setRepoLoaded] = React.useState(false);
  const [repoError, setRepoError] = React.useState<unknown>();

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const res = await consoleFetch('/api/helm/charts/index.yaml');
        const yaml = await res.text();
        setRepoIndex(load(yaml) as HelmRepoIndex);
      } catch (e) {
        setRepoError(e);
      } finally {
        setRepoLoaded(true);
      }
    };
    fetch();
  }, []);

  return [repoIndex, repoLoaded, repoError];
};

export const getRepoCharts = (index: HelmRepoIndex, repoName: string) =>
  Object.keys(index?.entries || {})
    .filter((k) => {
      const keyParts = k.split('--');
      return keyParts[keyParts.length - 1] === repoName;
    })
    .reduce((acc, k) => {
      return [...acc, ...(index?.entries?.[k] || [])];
    }, [] as { name: string; version: string; created: string }[]);

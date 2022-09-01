/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { helmRepoGVK, TEMPLATES_HELM_REPO_LABEL } from '../constants';
import { HelmChartRepository } from '../types';

export const useHelmRepositories = (): [HelmChartRepository[], boolean, unknown] => {
  const [repositories, loaded, loadError] = useK8sWatchResource<HelmChartRepository[]>({
    groupVersionKind: helmRepoGVK,
    isList: true,
  });

  const templateRepositories = React.useMemo(
    () => repositories.filter(({ metadata }) => !!metadata?.labels?.[TEMPLATES_HELM_REPO_LABEL]),
    [repositories],
  );
  return [templateRepositories, loaded, loadError];
};

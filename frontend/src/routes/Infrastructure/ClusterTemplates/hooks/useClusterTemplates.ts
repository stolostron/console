/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateGVK } from '../constants';
import { ClusterTemplate } from '../types';

export const useClusterTemplates = (): [ClusterTemplate[], boolean, unknown] =>
  useK8sWatchResource<ClusterTemplate[]>({
    groupVersionKind: clusterTemplateGVK,
    isList: true,
  });

export const useClusterTemplatesCount = () => {
  const [templates, loaded, error] = useClusterTemplates();
  return loaded && !error ? templates.length : undefined;
};

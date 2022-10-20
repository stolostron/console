/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateInstanceGVK } from '../constants';
import { ClusterTemplateInstance } from '../types';

export const useAllClusterTemplateInstances = (): [ClusterTemplateInstance[], boolean, unknown] =>
  useK8sWatchResource<ClusterTemplateInstance[]>({
    groupVersionKind: clusterTemplateInstanceGVK,
    isList: true,
  });

export const useClusterTemplateInstances = (
  clusterTemplateName?: string,
): [ClusterTemplateInstance[], boolean, unknown] => {
  const [allInstances, loaded, error] = useAllClusterTemplateInstances();
  if (!loaded || error) {
    return [[], loaded, error];
  }
  const instances = allInstances.filter(
    (instance) => instance.spec?.clusterTemplateRef === clusterTemplateName,
  );
  return [instances, true, null];
};

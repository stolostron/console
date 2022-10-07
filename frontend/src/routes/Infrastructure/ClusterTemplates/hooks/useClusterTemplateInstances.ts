/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateInstanceGVK } from '../constants';
import { ClusterTemplateInstance } from '../types';

export const useClusterTemplateInstances = (): [ClusterTemplateInstance[], boolean, unknown] =>
  useK8sWatchResource<ClusterTemplateInstance[]>({
    groupVersionKind: clusterTemplateInstanceGVK,
    isList: true,
  });

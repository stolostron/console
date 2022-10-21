/* Copyright Contributors to the Open Cluster Management project */
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const HCRModelMock: K8sModel & { path: string } = {
  kind: 'HelmChartRepository',
  namespaced: false,
  verbs: ['delete', 'deletecollection', 'get', 'list', 'patch', 'create', 'update', 'watch'],
  label: 'Helm Chart Repository',
  plural: 'helmchartrepositories',
  apiVersion: 'v1beta1',
  abbr: 'HCR',
  apiGroup: 'helm.openshift.io',
  labelPlural: 'Helm Chart Repositories',
  path: 'helmchartrepositories',
  id: 'helmchartrepository',
  crd: true,
};

export const ConfigMapModelMock: K8sModel = {
  apiVersion: 'v1',
  label: 'ConfigMap',
  labelKey: 'public~ConfigMap',
  plural: 'configmaps',
  abbr: 'CM',
  namespaced: true,
  kind: 'ConfigMap',
  id: 'configmap',
  labelPlural: 'ConfigMaps',
  labelPluralKey: 'public~ConfigMaps',
  verbs: ['create', 'delete', 'deletecollection', 'get', 'list', 'patch', 'update', 'watch'],
  shortNames: ['cm'],
};

export const SecretModelMock: K8sModel = {
  apiVersion: 'v1',
  label: 'Secret',
  labelKey: 'public~Secret',
  plural: 'secrets',
  abbr: 'S',
  namespaced: true,
  kind: 'Secret',
  id: 'secret',
  labelPlural: 'Secrets',
  labelPluralKey: 'public~Secrets',
  verbs: ['create', 'delete', 'deletecollection', 'get', 'list', 'patch', 'update', 'watch'],
};

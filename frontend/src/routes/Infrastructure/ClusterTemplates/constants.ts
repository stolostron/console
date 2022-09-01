/* Copyright Contributors to the Open Cluster Management project */
export const TEMPLATES_HELM_REPO_LABEL = 'clustertemplates.openshift.io/helm-repo';

export const helmRepoGVK = {
  kind: 'HelmChartRepository',
  version: 'v1beta1',
  group: 'helm.openshift.io',
};

export const clusterTemplateGVK = {
  kind: 'ClusterTemplate',
  version: 'v1alpha1',
  group: 'clustertemplate.openshift.io',
};

export const clusterTemplateQuotaGVK = {
  kind: 'ClusterTemplateQuota',
  version: 'v1alpha1',
  group: 'clustertemplate.openshift.io',
};

export const clusterTemplateInstanceGVK = {
  kind: 'ClusterTemplateInstance',
  version: 'v1alpha1',
  group: 'clustertemplate.openshift.io',
};

export const pipelineGVK = {
  group: 'tekton.dev',
  version: 'v1beta1',
  kind: 'Pipeline',
};

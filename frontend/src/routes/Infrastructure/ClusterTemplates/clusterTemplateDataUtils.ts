/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import _ from 'lodash';
import { ApplicationSpec, ClusterTemplate, ClusterTemplateVendor } from './types';

const TEMPLATES_LABEL_PREFIX = 'clustertemplates.openshift.io';

export const TEMPLATE_LABELS = {
  location: `${TEMPLATES_LABEL_PREFIX}/location`,
  infra: `${TEMPLATES_LABEL_PREFIX}/infra`,
  description: `${TEMPLATES_LABEL_PREFIX}/description`,
  vendor: `${TEMPLATES_LABEL_PREFIX}/vendor`,
};

const getLabelValue = (resource: K8sResourceCommon, labelName: string): string | undefined =>
  _.get(resource, ['metadata', 'labels', labelName]);

export const getClusterTemplateVendor = (
  clusterTemplate: ClusterTemplate,
): ClusterTemplateVendor | undefined => {
  const labelValue = getLabelValue(clusterTemplate, TEMPLATE_LABELS.vendor);
  if (!labelValue) {
    return undefined;
  }
  return labelValue === ClusterTemplateVendor.REDHAT
    ? ClusterTemplateVendor.REDHAT
    : ClusterTemplateVendor.CUSTOM;
};

export const getClusterTemplateDescription = (
  clusterTemplate: ClusterTemplate,
): string | undefined => {
  return _.get(clusterTemplate, ['metadata', 'annotations', TEMPLATE_LABELS.description]);
};

export const getClusterTemplateLocation = (clusterTemplate: ClusterTemplate): string | undefined =>
  getLabelValue(clusterTemplate, TEMPLATE_LABELS.location);

export const getClusterTemplateInfraType = (clusterTemplate: ClusterTemplate): string | undefined =>
  getLabelValue(clusterTemplate, TEMPLATE_LABELS.infra);

export const isHelmAppSpec = (appSpec: ApplicationSpec) => !!appSpec.source.chart;

export const getClusterDefinitionHelmChart = (clusterTemplate: ClusterTemplate) =>
  clusterTemplate.spec.clusterDefinition.applicationSpec.source.chart;

export const isHelmClusterDefinition = (clusterTemplate: ClusterTemplate) =>
  isHelmAppSpec(clusterTemplate.spec.clusterDefinition.applicationSpec);

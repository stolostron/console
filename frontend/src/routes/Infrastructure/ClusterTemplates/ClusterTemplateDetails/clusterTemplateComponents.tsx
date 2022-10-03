/* Copyright Contributors to the Open Cluster Management project */
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Label } from '@patternfly/react-core';
import React from 'react';
import { useTranslation } from '../../../../lib/acm-i18next';
import { getClusterTemplateVendor } from '../clusterTemplateLabelUtils';
import { helmRepoGVK } from '../constants';
import { useClusterTemplateInstances } from '../hooks/useClusterTemplateInstances';
import { ClusterTemplate, ClusterTemplateVendor } from '../types';
import { LoadingHelper } from '../utils';

export const ClusterTemplateUsage: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => {
  const { t } = useTranslation();
  const [instances, loaded, loadError] = useClusterTemplateInstances(
    clusterTemplate.metadata?.name,
  );
  return (
    <LoadingHelper isLoaded={loaded} error={loadError}>
      {t('{{count}} cluster', {
        count: instances.length,
      })}
    </LoadingHelper>
  );
};

export const ClusterTemplateVendorLabel: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => {
  const { t } = useTranslation();
  const vendor = getClusterTemplateVendor(clusterTemplate);
  if (!vendor) {
    return <>-</>;
  }
  const color = vendor === ClusterTemplateVendor.REDHAT ? 'green' : 'purple';
  const labelText =
    vendor === ClusterTemplateVendor.REDHAT ? t('Red Hat template') : t('Custom template');
  return <Label color={color}>{labelText}</Label>;
};

export const ClusterTemplateHelmChartLink: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => {
  const repo = clusterTemplate.spec.helmChartRef.repository;
  return <ResourceLink groupVersionKind={helmRepoGVK} name={repo} hideIcon />;
};

export const ClusterTemplateCost: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => {
  const { t } = useTranslation();
  return <>{`${clusterTemplate.spec.cost} / ${t('Per use')}`}</>;
};

export const ClusterTemplatePipelineLink: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) =>
  clusterTemplate.spec.clusterSetup?.pipeline ? (
    <ResourceLink
      groupVersionKind={helmRepoGVK}
      name={clusterTemplate.spec.clusterSetup.pipeline.name}
      namespace={clusterTemplate.spec.clusterSetup.pipeline.namespace}
      hideIcon
    />
  ) : (
    <>-</>
  );

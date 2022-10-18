/* Copyright Contributors to the Open Cluster Management project */
import { Label } from '@patternfly/react-core';
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../../../lib/acm-i18next';
import {
  getClusterDefinitionHelmChart,
  getClusterTemplateVendor,
  isHelmClusterDefinition,
} from '../clusterTemplateDataUtils';
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

export const ClusterTemplateHelmResourceLink: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => {
  return isHelmClusterDefinition(clusterTemplate) ? (
    <Link
      to={{
        pathname: clusterTemplate.spec.clusterDefinition.applicationSpec.source.repoURL,
      }}
    >
      {clusterTemplate.spec.clusterDefinition.applicationSpec.source.repoURL}
    </Link>
  ) : (
    <>-</>
  );
};

export const ClusterTemplateHelmChart: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => (
  <>
    {isHelmClusterDefinition(clusterTemplate)
      ? getClusterDefinitionHelmChart(clusterTemplate)
      : '-'}
  </>
);
export const ClusterTemplateCost: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => {
  const { t } = useTranslation();
  return <>{`${clusterTemplate.spec.cost} / ${t('Per use')}`}</>;
};

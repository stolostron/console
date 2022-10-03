/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Popover,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon, PencilAltIcon } from '@patternfly/react-icons';
import React from 'react';
import { useTranslation } from '../../../../lib/acm-i18next';
import { AcmLabels } from '../../../../ui-components';
import { EditLabels } from '../../Clusters/ManagedClusters/components/EditLabels';

import {
  getClusterTemplateDescription,
  getClusterTemplateInfraType,
  getClusterTemplateLocation,
} from '../clusterTemplateLabelUtils';
import { clusterTemplateGVK } from '../constants';
import {
  ClusterTemplateCost,
  ClusterTemplateHelmChartLink,
  ClusterTemplatePipelineLink,
  ClusterTemplateUsage,
  ClusterTemplateVendorLabel,
} from './clusterTemplateComponents';
import { ClusterTemplate } from '../types';

export type ListItem = {
  label: string;
  action?: React.ReactNode;
  value?: string | number | React.ReactNode | undefined;
};
const clusterTemplateDefinition = {
  kind: clusterTemplateGVK.kind,
  apiVersion: `${clusterTemplateGVK.group}/${clusterTemplateGVK.version}`,
};

const CostItem: React.FC<{ clusterTemplate: ClusterTemplate }> = ({ clusterTemplate }) => {
  const { t } = useTranslation();
  return (
    <>
      <ClusterTemplateCost clusterTemplate={clusterTemplate} />
      <Popover
        bodyContent={t(
          'Cost is estimated according to the maximum number of nodes specified for this template',
        )}
      >
        <Button variant="link" style={{ paddingLeft: 'var(--pf-global--spacer--sm)' }}>
          <OutlinedQuestionCircleIcon />
        </Button>
      </Popover>
    </>
  );
};
const List: React.FC<{ items: ListItem[] }> = ({ items }) => {
  return (
    <DescriptionList isHorizontal>
      {items.map(({ label, action, value }) => (
        <DescriptionListGroup label={label}>
          <DescriptionListTerm id={`${label} label`}>
            {label} {action}
          </DescriptionListTerm>
          <DescriptionListDescription id={`${label} value`}>
            {value ?? '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};

const DetailsSections: React.FC<{ clusterTemplate: ClusterTemplate }> = ({ clusterTemplate }) => {
  const { t } = useTranslation();
  const name = clusterTemplate.metadata?.name;
  const [showEditLabels, setShowEditLabels] = React.useState<boolean>(false);
  const leftItems: ListItem[] = [
    {
      label: t('Template name'),
      value: name,
    },
    {
      label: t('HELM chart repository'),
      value: <ClusterTemplateHelmChartLink clusterTemplate={clusterTemplate} />,
    },
    {
      label: t('HELM chart name'),
      value: clusterTemplate.spec.helmChartRef.name,
    },
    {
      label: t('HELM chart version'),
      value: clusterTemplate.spec.helmChartRef.version,
    },
    {
      label: t('Infrastructure type'),
      value: getClusterTemplateInfraType(clusterTemplate),
    },
    {
      label: t('table.labels'),
      value: clusterTemplate.metadata?.labels && (
        <AcmLabels labels={clusterTemplate.metadata?.labels} />
      ),
      action: (
        <Button
          onClick={() => setShowEditLabels(true)}
          variant={ButtonVariant.link}
          aria-label={t('labels.edit.title')}
          icon={<PencilAltIcon />}
        ></Button>
      ),
    },
  ];

  const rightItems: ListItem[] = [
    {
      label: t('Pipeline'),
      value: <ClusterTemplatePipelineLink clusterTemplate={clusterTemplate} />,
    },
    {
      label: t('Description'),
      value: getClusterTemplateDescription(clusterTemplate),
    },
    {
      label: t('Location'),
      value: getClusterTemplateLocation(clusterTemplate),
    },
    {
      label: t('Cost estimation'),
      value: <CostItem clusterTemplate={clusterTemplate} />,
    },
    {
      label: t('Template uses'),
      value: <ClusterTemplateUsage clusterTemplate={clusterTemplate} />,
    },
    {
      label: t('Vendor'),
      value: <ClusterTemplateVendorLabel clusterTemplate={clusterTemplate} />,
    },
  ];

  return (
    <>
      <Grid sm={12} md={6}>
        <GridItem>
          <List items={leftItems} />
        </GridItem>
        <GridItem>
          <List items={rightItems} />
        </GridItem>
      </Grid>
      <EditLabels
        resource={
          showEditLabels
            ? {
                ...clusterTemplateDefinition,
                metadata: {
                  name: name,
                  labels: clusterTemplate.metadata?.labels,
                },
              }
            : undefined
        }
        displayName={name}
        close={() => setShowEditLabels(false)}
      />
    </>
  );
};

export default DetailsSections;

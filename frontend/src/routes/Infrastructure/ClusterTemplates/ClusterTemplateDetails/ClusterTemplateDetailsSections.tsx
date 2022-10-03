/* Copyright Contributors to the Open Cluster Management project */
import { Stack, StackItem } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from '../../../../lib/acm-i18next';
import { AcmExpandableCard } from '../../../../ui-components';
import { ClusterTemplate } from '../types';
import DetailsSection from './DetailsSection';
import InstanceYamlSection from './InstanceYamlSection';
import QuotasSection from './QuotaSection';
import UsageSection from './UsageSection';
enum Section {
  Details = 'details',
  Quotas = 'quotas',
  Uses = 'uses',
  InstanceYaml = 'instanceYaml',
}

const getSectionTitles = (t: TFunction): { [i in Section]: string } => ({
  [Section.InstanceYaml]: t('Download template instance YAML file to instantiate the template'),
  [Section.Details]: t('Details'),
  [Section.Quotas]: t('Quotas'),
  [Section.Uses]: t('Template uses'),
});

const getSectionComponents = (): {
  [i in Section]: React.FC<{ clusterTemplate: ClusterTemplate }>;
} => ({
  [Section.InstanceYaml]: InstanceYamlSection,
  [Section.Details]: DetailsSection,
  [Section.Quotas]: QuotasSection,
  [Section.Uses]: UsageSection,
});

const ClusterTemplateDetailsSections: React.FC<{ clusterTemplate: ClusterTemplate }> = ({
  clusterTemplate,
}) => {
  const { t } = useTranslation();
  const titles = getSectionTitles(t);
  const components = getSectionComponents();
  return (
    <Stack hasGutter>
      {Object.keys(titles).map((key) => {
        const section: Section = key as any as Section;
        const Component = components[section];
        return (
          <StackItem key={key}>
            <AcmExpandableCard title={titles[section]} id={key}>
              <Component clusterTemplate={clusterTemplate} />
            </AcmExpandableCard>
          </StackItem>
        );
      })}
    </Stack>
  );
};

export default ClusterTemplateDetailsSections;

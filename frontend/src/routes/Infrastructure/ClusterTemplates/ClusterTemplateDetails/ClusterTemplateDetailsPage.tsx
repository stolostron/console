/* Copyright Contributors to the Open Cluster Management project */
import { K8sGroupVersionKind } from '@openshift-console/dynamic-plugin-sdk';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Page,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { LoadingPage } from '../../../../components/LoadingPage';
import { useTranslation } from '../../../../lib/acm-i18next';
import { AcmErrorBoundary } from '../../../../ui-components';
import ErrorState from '../helpers/ErrorState';
import { useClusterTemplate } from '../hooks/useClusterTemplates';
import ClusterTemplateDetailsSections from './ClusterTemplateDetailsSections';

export const getResourceListPageUrl = (resourceGVK: K8sGroupVersionKind) =>
  `/k8s/cluster/${resourceGVK.group}~${resourceGVK.version}~${resourceGVK.kind}/~tabs`;

const PageBreadcrumb: React.FC<{ clusterTemplateName: string }> = ({ clusterTemplateName }) => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <Button variant="link" isInline onClick={() => history.goBack()}>
          {t('Cluster templates')}
        </Button>
      </BreadcrumbItem>
      <BreadcrumbItem isActive>{clusterTemplateName}</BreadcrumbItem>
    </Breadcrumb>
  );
};

const PageHeader: React.FC<{ clusterTemplateName: string }> = ({ clusterTemplateName }) => {
  return (
    <PageSection
      variant={PageSectionVariants.light}
      style={{
        paddingTop: 'var(--pf-c-page__main-breadcrumb--PaddingTop)',
      }}
    >
      <Stack hasGutter>
        <StackItem>
          <PageBreadcrumb clusterTemplateName={clusterTemplateName} />
        </StackItem>
        <StackItem>
          <Title headingLevel="h1">{clusterTemplateName}</Title>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

const ClusterTemplateDetailsPage: React.FC<{ match: { params: { name: string } } }> = ({
  match,
}: any) => {
  const { name } = match.params;
  const [clusterTemplate, loaded, loadError] = useClusterTemplate(name);
  if (loadError) {
    return <ErrorState error={loadError}></ErrorState>;
  }
  if (!loaded) {
    return <LoadingPage />;
  }
  return (
    <Page>
      <AcmErrorBoundary>
        <PageHeader clusterTemplateName={name} />
        <PageSection>
          <ClusterTemplateDetailsSections clusterTemplate={clusterTemplate} />
        </PageSection>
      </AcmErrorBoundary>
    </Page>
  );
};

export default ClusterTemplateDetailsPage;

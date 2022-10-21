/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import { ListPageCreateDropdown, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { useHistory, useLocation } from 'react-router-dom';
import ClusterTemplatesTab from './ClusterTemplatesTab';
import HelmRepositoriesTab from './HelmRepositoriesTab';
import { useClusterTemplatesCount } from '../hooks/useClusterTemplates';
import { useHelmRepositoriesCount } from '../hooks/useHelmRepositories';
import { useTranslation } from '../../../../lib/acm-i18next';
import { clusterTemplateGVK } from '../constants';
import { getNavLabelWithCount } from '../utils';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';

const clusterTemplateReference = `${clusterTemplateGVK.group}~${clusterTemplateGVK.version}~${clusterTemplateGVK.kind}`;

const useActiveTab = () => {
  const { search } = useLocation();
  const activeTab = React.useMemo(() => {
    const query = new URLSearchParams(search);
    return query.get('tab') === 'repositories' ? 'repositories' : 'templates';
  }, [search]);
  return activeTab;
};

const ClusterTemplatesPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const templatesCount = useClusterTemplatesCount();
  const helmRepositoriesCount = useHelmRepositoriesCount();
  const activeTab = useActiveTab();

  const actionItems = React.useMemo(
    () => ({
      NEW_CLUSTER_TEMPLATE: t('Cluster template'),
      NEW_HELM_CHART_REPOSITORY: t('HELM repository'),
    }),
    [t],
  );

  const handleCreateDropdownActionClick = (item: string) => {
    switch (item) {
      case 'NEW_CLUSTER_TEMPLATE':
        history.push(`/k8s/cluster/${clusterTemplateReference}/~new`);
        break;
      case 'NEW_HELM_CHART_REPOSITORY':
        history.push(`/k8s/cluster/${clusterTemplateReference}/~newRepository`);
        break;
    }
  };

  const handleTabSelect: React.ComponentProps<typeof Tabs>['onSelect'] = (_, eventKey) => {
    switch (eventKey) {
      case 'repositories':
        history.push(`/k8s/cluster/${clusterTemplateReference}?tab=repositories`);
        break;
      default:
        history.push(`/k8s/cluster/${clusterTemplateReference}`);
    }
  };

  return (
    <>
      <ListPageHeader title="Cluster templates">
        <ListPageCreateDropdown
          createAccessReview={{ groupVersionKind: clusterTemplateReference }}
          items={actionItems}
          onClick={handleCreateDropdownActionClick}
        >
          {t('Create')}
        </ListPageCreateDropdown>
      </ListPageHeader>
      <div className="co-m-page__body">
        <Tabs
          activeKey={activeTab}
          onSelect={handleTabSelect}
          aria-label="Cluster templates page tabs"
          role="resource-list-tabs"
          usePageInsets
        >
          <Tab
            eventKey="templates"
            title={<TabTitleText>{getNavLabelWithCount('Templates', templatesCount)}</TabTitleText>}
            aria-label="Cluster templates tab"
          />
          <Tab
            eventKey="repositories"
            title={
              <TabTitleText>
                {getNavLabelWithCount('HELM repositories', helmRepositoriesCount)}
              </TabTitleText>
            }
            aria-label="HELM repositories tab"
          />
        </Tabs>
        {activeTab === 'repositories' ? <HelmRepositoriesTab /> : <ClusterTemplatesTab />}
      </div>
    </>
  );
};

export default ClusterTemplatesPage;

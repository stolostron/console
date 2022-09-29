/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import {
  HorizontalNav,
  ListPageCreateDropdown,
  ListPageHeader,
  NavPage,
} from '@openshift-console/dynamic-plugin-sdk';
import { Redirect, Switch, useHistory } from 'react-router-dom';
import ClusterTemplatesTab from './ClusterTemplatesTab';
import HelmRepositoriesTab from './HelmRepositoriesTab';
import { useClusterTemplatesCount } from '../hooks/useClusterTemplates';
import { useHelmRepositoriesCount } from '../hooks/useHelmRepositories';
import { getNavLabelWithCount } from '../utils';
import { useTranslation } from '../../../../lib/acm-i18next';
import { clusterTemplateGVK } from '../constants';
import { getReference } from '@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s-ref';

const clusterTemplateReference = getReference(clusterTemplateGVK);

const ClusterTemplatesPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const templatesCount = useClusterTemplatesCount();
  const helmRepositoriesCount = useHelmRepositoriesCount();

  const pages: NavPage[] = React.useMemo(
    () => [
      {
        href: '',
        name: getNavLabelWithCount('Templates', templatesCount),
        component: ClusterTemplatesTab,
      },
      {
        href: 'repositories',
        name: getNavLabelWithCount('HELM repositories', helmRepositoriesCount),
        component: HelmRepositoriesTab,
      },
    ],
    [templatesCount, helmRepositoriesCount],
  );
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

  return (
    <Switch>
      <Redirect
        from={`/k8s/cluster/${clusterTemplateReference}`}
        to={`/k8s/cluster/${clusterTemplateReference}/~tabs`}
        exact
      />
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

        <HorizontalNav pages={pages} />
      </>
    </Switch>
  );
};

export default ClusterTemplatesPage;

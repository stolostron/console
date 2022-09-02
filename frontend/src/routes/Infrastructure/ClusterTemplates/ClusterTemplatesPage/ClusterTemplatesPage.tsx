/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import {
  HorizontalNav,
  ListPageCreate,
  ListPageCreateButton,
  ListPageHeader,
  NavPage,
} from '@openshift-console/dynamic-plugin-sdk';
import { useHistory } from 'react-router-dom';
import ClusterTemplatesTab from './ClusterTemplatesTab';
import HelmRepositoriesTab from './HelmRepositoriesTab';
import { useClusterTemplatesCount } from '../hooks/useClusterTemplates';
import { useHelmRepositoriesCount } from '../hooks/useHelmRepositories';
import { getNavLabelWithCount } from '../utils';

const ClusterTemplatesPage = () => {
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

  const repositoriesPage = history.location.pathname.endsWith('/repositories');
  return (
    <>
      <ListPageHeader title="Cluster templates">
        {!repositoriesPage ? (
          <ListPageCreate groupVersionKind="clustertemplate.openshift.io~v1alpha1~ClusterTemplate">
            Create
          </ListPageCreate>
        ) : (
          <ListPageCreateButton onClick={() => history.push('repositories/~new')}>
            Create
          </ListPageCreateButton>
        )}
      </ListPageHeader>

      <HorizontalNav pages={pages} />
    </>
  );
};

export default ClusterTemplatesPage;

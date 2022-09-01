/* Copyright Contributors to the Open Cluster Management project */
import {
  HorizontalNav,
  ListPageCreate,
  ListPageCreateButton,
  ListPageHeader,
} from '@openshift-console/dynamic-plugin-sdk';
import { useHistory } from 'react-router-dom';
import ClusterTemplatesTab from './ClusterTemplatesTab';
import HelmRepositoriesPage from './HelmRepositoriesPage';

const pages = [
  {
    href: '',
    name: 'Templates',
    component: ClusterTemplatesTab,
  },
  {
    href: 'repositories',
    name: 'HELM repositories',
    component: HelmRepositoriesPage,
  },
];

const ClusterTemplatesPage = () => {
  const history = useHistory();

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

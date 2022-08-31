/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import {
  k8sDelete,
  ResourceLink,
  RowProps,
  TableData,
  useK8sModel,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Label,
  Modal,
  ModalVariant,
  PageSection,
  Skeleton,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import { ExternalLink } from 'openshift-assisted-ui-lib/cim';
import { clusterTemplateGVK, helmRepoGVK } from '../constants';
import { ClusterTemplate, HelmChartRepository, HelmRepoIndex } from '../types';
import { useHelmRepositories } from '../hooks/useHelmRepositories';
import { useHelmRepositoryIndex, getRepoCharts } from '../hooks/useHelmRepositoryIndex';

const columns = [
  {
    title: 'Name',
    sort: 'metadata.name',
    transforms: [sortable],
    id: 'name',
  },
  {
    title: 'Repo URL',
    sort: 'spec.connectionConfig.url',
    transforms: [sortable],
    id: 'url',
  },
  {
    title: 'Helm charts',
    sort: 'spec.connectionConfig.url',
    transforms: [sortable],
    id: 'charts',
  },
  {
    title: 'Templates published',
    sort: 'spec.connectionConfig.url',
    transforms: [sortable],
    id: 'templates',
  },
  {
    title: '',
    id: 'kebab-menu',
    props: { className: 'pf-c-table__action' },
  },
];

const HelmRepoRow: React.FC<RowProps<HelmChartRepository>> = ({ obj, activeColumnIDs }) => {
  const [isOpen, setOpen] = React.useState(false);
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const [model] = useK8sModel(helmRepoGVK);
  const { indexFile, loaded, error } = React.useContext(RowContext);
  const [templates, templatesLoaded, loadError] = useK8sWatchResource<ClusterTemplate[]>({
    groupVersionKind: clusterTemplateGVK,
    isList: true,
  });

  const templatesFromRepo = templates.filter(
    (t) => t.spec.helmChartRef.repository === obj.metadata?.name,
  );

  const chartsFromRepo = indexFile
    ? getRepoCharts(indexFile, obj.metadata?.name || '').length
    : '-';

  return (
    <>
      <TableData id="name" activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          groupVersionKind={helmRepoGVK}
          name={obj.metadata?.name}
          namespace={obj.metadata?.namespace}
        />
      </TableData>
      <TableData id="url" activeColumnIDs={activeColumnIDs}>
        <ExternalLink href={obj.spec.connectionConfig.url} />
      </TableData>
      <TableData id="charts" activeColumnIDs={activeColumnIDs}>
        {!loaded ? <Skeleton /> : error ? <>-</> : <>{chartsFromRepo}</>}
      </TableData>
      <TableData id="url" activeColumnIDs={activeColumnIDs}>
        {!templatesLoaded ? (
          <Skeleton />
        ) : loadError ? (
          <>-</>
        ) : (
          <Label color="green" icon={<CheckCircleIcon />}>
            {templatesFromRepo.length}
          </Label>
        )}
      </TableData>
      <TableData id="kebab-menu" activeColumnIDs={activeColumnIDs} className="pf-c-table__action">
        <Dropdown
          toggle={<KebabToggle onToggle={setOpen} id="toggle-id-6" />}
          isOpen={isOpen}
          isPlain
          dropdownItems={[
            <DropdownItem
              onClick={() => {
                setDeleteOpen(true);
                setOpen(false);
              }}
              key="delete"
            >
              Delete HelmChartRepository
            </DropdownItem>,
          ]}
          position="right"
        />
      </TableData>
      {isDeleteOpen && (
        <Modal
          variant={ModalVariant.small}
          isOpen
          title="Delete HelmChartRepository"
          titleIconVariant="warning"
          showClose
          onClose={() => setDeleteOpen(false)}
          actions={[
            <Button
              key="confirm"
              variant="danger"
              onClick={async () => {
                await k8sDelete({
                  model,
                  resource: obj,
                });
                setDeleteOpen(false);
              }}
            >
              Delete
            </Button>,
            <Button key="cancel" variant="link" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>,
          ]}
        >
          Are you sure you want to delete ?
        </Modal>
      )}
    </>
  );
};

const RowContext = React.createContext<{
  indexFile: HelmRepoIndex | undefined;
  loaded: boolean;
  error: unknown;
}>({
  indexFile: undefined,
  loaded: false,
  error: undefined,
});

const HelmRepositoriesPage = () => {
  const [repositories, loaded, loadError] = useHelmRepositories();
  const [repoIndex, repoLoaded, repoError] = useHelmRepositoryIndex();

  return (
    <PageSection>
      <RowContext.Provider
        value={{
          indexFile: repoIndex,
          loaded: repoLoaded,
          error: repoError,
        }}
      >
        <VirtualizedTable
          data={repositories}
          unfilteredData={repositories}
          columns={columns}
          Row={HelmRepoRow}
          loaded={loaded}
          loadError={loadError}
        />
      </RowContext.Provider>
    </PageSection>
  );
};

export default HelmRepositoriesPage;

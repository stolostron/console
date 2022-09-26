/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import {
  k8sDelete,
  ResourceLink,
  RowProps,
  TableData,
  useK8sModel,
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
  Truncate,
  Text,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import { helmRepoGVK } from '../constants';
import { HelmChartRepository, HelmRepoIndex } from '../types';
import { useHelmRepositories } from '../hooks/useHelmRepositories';
import { useHelmRepositoryIndex, getRepoCharts } from '../hooks/useHelmRepositoryIndex';
import { useClusterTemplates } from '../hooks/useClusterTemplates';
import { useTranslation } from '../../../../lib/acm-i18next';
import { LoadingHelper } from '../utils';

const HelmRepoRow: React.FC<RowProps<HelmChartRepository>> = ({ obj, activeColumnIDs }) => {
  const [isOpen, setOpen] = React.useState(false);
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const [model] = useK8sModel(helmRepoGVK);
  const {
    indexFile,
    loaded: repoIndexLoaded,
    error: repoIndexError,
  } = React.useContext(RowContext);
  const [templates, templatesLoaded, templatesLoadError] = useClusterTemplates();
  const { t } = useTranslation();

  const templatesFromRepo = templates.filter(
    (t) => t.spec.helmChartRef.repository === obj.metadata?.name,
  );
  const repoChartsCount = indexFile
    ? getRepoCharts(indexFile, obj.metadata?.name ?? '').length ?? '-'
    : '-';
  const repoChartsUpdatedAt = indexFile ? new Date(indexFile.generated).toLocaleString() : '-';

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
        <Text
          component="a"
          href={obj.spec.connectionConfig.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Truncate
            content={obj.spec.connectionConfig.url}
            position={'middle'}
            trailingNumChars={10}
          />
        </Text>
      </TableData>
      <TableData id="credentials" activeColumnIDs={activeColumnIDs}>
        {obj.spec.connectionConfig.tlsConfig ? t('Authenticated') : t('Not required')}
      </TableData>
      <TableData id="updated-at" activeColumnIDs={activeColumnIDs}>
        <LoadingHelper isLoaded={repoIndexLoaded} error={repoIndexError}>
          {repoChartsUpdatedAt}
        </LoadingHelper>
      </TableData>
      <TableData id="charts" activeColumnIDs={activeColumnIDs}>
        <LoadingHelper isLoaded={repoIndexLoaded} error={repoIndexError}>
          {repoChartsCount}
        </LoadingHelper>
      </TableData>
      <TableData id="templates" activeColumnIDs={activeColumnIDs}>
        <LoadingHelper isLoaded={templatesLoaded} error={templatesLoadError}>
          <Label color="green" icon={<CheckCircleIcon />}>
            {templatesFromRepo.length}
          </Label>
        </LoadingHelper>
      </TableData>
      <TableData id="group" activeColumnIDs={activeColumnIDs}>
        -
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
              {t('Delete HelmChartRepository')}
            </DropdownItem>,
          ]}
          position="right"
        />
      </TableData>
      {isDeleteOpen && (
        <Modal
          variant={ModalVariant.small}
          isOpen
          title={t('Delete HelmChartRepository')}
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
              {t('Delete')}
            </Button>,
            <Button key="cancel" variant="link" onClick={() => setDeleteOpen(false)}>
              {t('Cancel')}
            </Button>,
          ]}
        >
          {t('Are you sure you want to delete?')}
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

const HelmRepositoriesTab = () => {
  const [repositories, loaded, loadError] = useHelmRepositories();
  const [repoIndex, repoLoaded, repoError] = useHelmRepositoryIndex();
  const { t } = useTranslation();

  const columns = React.useMemo(
    () => [
      {
        title: t('Name'),
        sort: 'metadata.name',
        transforms: [sortable],
        id: 'name',
      },
      {
        title: t('URL'),
        sort: 'spec.connectionConfig.url',
        transforms: [sortable],
        id: 'url',
      },
      {
        title: t('Credentials'),
        sort: 'spec.connectionConfig.url',
        transforms: [sortable],
        id: 'credentials',
      },
      {
        title: t('Last updated'),
        sort: 'spec.connectionConfig.url',
        transforms: [sortable],
        id: 'updated-at',
      },
      {
        title: t('Helm charts'),
        sort: 'spec.connectionConfig.url',
        transforms: [sortable],
        id: 'charts',
      },
      {
        title: t('Templates published'),
        sort: 'spec.connectionConfig.url',
        transforms: [sortable],
        id: 'templates',
      },
      {
        title: t('Group'),
        sort: 'spec.connectionConfig.url',
        transforms: [sortable],
        id: 'group',
      },
      {
        title: '',
        id: 'kebab-menu',
        props: { className: 'pf-c-table__action' },
      },
    ],
    [t],
  );
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
          data-testid="helm-repositories-table"
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

export default HelmRepositoriesTab;

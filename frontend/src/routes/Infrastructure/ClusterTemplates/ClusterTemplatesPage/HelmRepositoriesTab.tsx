/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import {
  k8sDelete,
  ResourceLink,
  useK8sModel,
  WatchK8sResult,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Label,
  Modal,
  ModalVariant,
  PageSection,
  Truncate,
  Text,
  KebabToggle,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import {
  ActionsColumn,
  CustomActionsToggleProps,
  IAction,
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TFunction } from 'react-i18next';
import { helmRepoGVK } from '../constants';
import { ClusterTemplate, HelmChartRepository } from '../types';
import { useHelmRepositories } from '../hooks/useHelmRepositories';
import {
  useHelmRepositoryIndex,
  getRepoCharts,
  HelmRepositoryIndexResult,
} from '../hooks/useHelmRepositoryIndex';
import { useClusterTemplates } from '../hooks/useClusterTemplates';
import { useTranslation } from '../../../../lib/acm-i18next';
import { LoadingHelper } from '../utils';

type TableColumn = {
  title: string;
  id: string;
};
type RowProps<D> = {
  obj: D;
};

const getTableColumns = (t: TFunction): TableColumn[] => [
  {
    title: t('Name'),
    id: 'name',
  },
  {
    title: t('URL'),
    id: 'url',
  },
  {
    title: t('Credentials'),
    id: 'credentials',
  },
  {
    title: t('Last updated'),
    id: 'updated-at',
  },
  {
    title: t('Helm charts'),
    id: 'charts',
  },
  {
    title: t('Templates published'),
    id: 'templates',
  },
  {
    title: t('Group'),
    id: 'group',
  },
  {
    title: '',
    id: 'kebab-menu',
  },
];

export const HelmRepoRow = ({ obj }: RowProps<HelmChartRepository>) => {
  const { t } = useTranslation();
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const [model] = useK8sModel(helmRepoGVK);
  const { helmRepoIndexResult, clusterTemplatesResult } = React.useContext(RowContext);
  const [repoIndex, repoIndexLoaded, repoIndexError] = helmRepoIndexResult;
  const [templates, templatesLoaded, templatesLoadError] = clusterTemplatesResult;

  const templatesFromRepo = templates.filter(
    (t) => t.spec.helmChartRef.repository === obj.metadata?.name,
  );
  const repoChartsCount = repoIndex
    ? getRepoCharts(repoIndex, obj.metadata?.name ?? '').length ?? '-'
    : '-';
  const repoChartsUpdatedAt = repoIndex ? new Date(repoIndex.generated).toLocaleString() : '-';

  const getRowActions = (): IAction[] => [
    {
      title: t('Delete HelmChartRepository'),
      onClick: () => setDeleteOpen(true),
    },
  ];

  const columns = React.useMemo(() => getTableColumns(t), [t]);

  return (
    <Tr>
      <Td dataLabel={columns[0].title}>
        <ResourceLink
          groupVersionKind={helmRepoGVK}
          name={obj.metadata?.name}
          namespace={obj.metadata?.namespace}
        />
      </Td>
      <Td dataLabel={columns[1].title}>
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
      </Td>
      <Td dataLabel={columns[2].title}>
        {obj.spec.connectionConfig.tlsConfig ? t('Authenticated') : t('Not required')}
      </Td>
      <Td dataLabel={columns[3].title}>
        <LoadingHelper isLoaded={repoIndexLoaded} error={repoIndexError}>
          {repoChartsUpdatedAt}
        </LoadingHelper>
      </Td>
      <Td dataLabel={columns[4].title}>
        <LoadingHelper isLoaded={repoIndexLoaded} error={repoIndexError}>
          {repoChartsCount}
        </LoadingHelper>
      </Td>
      <Td dataLabel={columns[5].title}>
        <LoadingHelper isLoaded={templatesLoaded} error={templatesLoadError}>
          <Label color="green" icon={<CheckCircleIcon />}>
            {templatesFromRepo.length}
          </Label>
        </LoadingHelper>
      </Td>
      <Td dataLabel={columns[6].title}>-</Td>
      <Td isActionCell>
        <ActionsColumn
          items={getRowActions()}
          actionsToggle={(props: CustomActionsToggleProps) => (
            <KebabToggle id="repo-actions-toggle" {...props} />
          )}
        />
      </Td>
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
    </Tr>
  );
};

export const RowContext = React.createContext<{
  helmRepoIndexResult: HelmRepositoryIndexResult;
  clusterTemplatesResult: WatchK8sResult<ClusterTemplate[]>;
}>(undefined!);

const HelmRepositoriesTab = () => {
  const [repositories] = useHelmRepositories();
  const [repoIndex, repoIndexLoaded, repoIndexError] = useHelmRepositoryIndex();
  const { t } = useTranslation();

  return (
    <PageSection>
      <RowContext.Provider
        value={{
          helmRepoIndexResult: [repoIndex, repoIndexLoaded, repoIndexError],
          clusterTemplatesResult: useClusterTemplates(),
        }}
      >
        <TableComposable
          aria-label="Helm repositories table"
          id="helm-repositories-table"
          variant="compact"
        >
          <Thead>
            <Tr>
              {getTableColumns(t).map((column) => (
                <Th key={column.id}>{column.title}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {repositories.map((repository) => (
              <HelmRepoRow key={repository.metadata?.name} obj={repository} />
            ))}
          </Tbody>
        </TableComposable>
      </RowContext.Provider>
    </PageSection>
  );
};

export default HelmRepositoriesTab;

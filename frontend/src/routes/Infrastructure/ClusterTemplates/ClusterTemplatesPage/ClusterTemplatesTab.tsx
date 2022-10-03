/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import { k8sDelete, ResourceLink, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Card,
  KebabToggle,
  Modal,
  ModalVariant,
  Page,
  PageSection,
} from '@patternfly/react-core';
import {
  ActionsColumn,
  Td,
  Th,
  Thead,
  Tr,
  CustomActionsToggleProps,
  IAction,
  TableComposable,
  Tbody,
} from '@patternfly/react-table';
import { clusterTemplateGVK } from '../constants';
import { ClusterTemplate, RowProps, TableColumn } from '../types';
import { useClusterTemplates } from '../hooks/useClusterTemplates';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TFunction } from 'react-i18next';
import { useTranslation } from '../../../../lib/acm-i18next';
import TableLoader from '../helpers/TableLoader';

import {
  ClusterTemplateHelmChartLink,
  ClusterTemplatePipelineLink,
  ClusterTemplateUsage,
} from '../ClusterTemplateDetails/clusterTemplateComponents';

function getTableColumns(t: TFunction): TableColumn[] {
  return [
    {
      title: t('Name'),
      id: 'name',
    },
    {
      title: t('HELM repository'),
      id: 'helm-repo',
    },
    {
      title: t('HELM chart'),
      id: 'helm-chart',
    },
    {
      title: t('Setup pipeline'),
      id: 'pipeline',
    },
    {
      title: t('Template uses'),
      id: 'usage',
    },
    {
      title: '',
      id: 'kebab-menu',
    },
  ];
}

export const ClusterTemplateRow: React.FC<RowProps<ClusterTemplate>> = ({ obj }) => {
  const { t } = useTranslation();
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const [model] = useK8sModel(clusterTemplateGVK);

  const getRowActions = (): IAction[] => [
    {
      title: t('Delete template'),
      onClick: () => setDeleteOpen(true),
    },
  ];

  const columns = React.useMemo(() => getTableColumns(t), [t]);

  return (
    <Tr>
      <Td id={columns[0].id} dataLabel={columns[0].title}>
        <ResourceLink
          groupVersionKind={clusterTemplateGVK}
          name={obj.metadata?.name}
          namespace={obj.metadata?.namespace}
          hideIcon
        />
      </Td>
      <Td id={columns[1].id} dataLabel={columns[1].title}>
        <ClusterTemplateHelmChartLink clusterTemplate={obj} />
      </Td>
      <Td id={columns[2].id} dataLabel={columns[2].title}>
        {obj.spec.helmChartRef?.name}
      </Td>
      <Td id={columns[3].id} dataLabel={columns[3].title}>
        <ClusterTemplatePipelineLink clusterTemplate={obj} />
      </Td>
      <Td id={columns[4].id} dataLabel={columns[4].title}>
        <ClusterTemplateUsage clusterTemplate={obj} />
      </Td>
      <Td id={columns[4].id} isActionCell>
        <ActionsColumn
          items={getRowActions()}
          actionsToggle={(props: CustomActionsToggleProps) => (
            <KebabToggle id="cluster-template-actions-toggle" {...props} />
          )}
        />
      </Td>
      {isDeleteOpen && (
        <Modal
          variant={ModalVariant.small}
          isOpen
          title="Delete cluster template"
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

const ClusterTemplatesTab = () => {
  const { t } = useTranslation();
  const [templates, loaded, loadError] = useClusterTemplates();
  return (
    <Page>
      <PageSection>
        <TableLoader
          loaded={loaded}
          error={loadError}
          errorId="templates-load-error"
          errorMessage={t('The cluster templates could not be loaded.')}
        >
          <Card>
            <TableComposable
              aria-label="Cluster templates table"
              id="cluster-templates-table"
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
                {templates.map((template) => (
                  <ClusterTemplateRow key={template.metadata?.name} obj={template} />
                ))}
              </Tbody>
            </TableComposable>
          </Card>
        </TableLoader>
      </PageSection>
    </Page>
  );
};

export default ClusterTemplatesTab;

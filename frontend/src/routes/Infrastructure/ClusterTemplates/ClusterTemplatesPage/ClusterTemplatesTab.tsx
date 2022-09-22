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
  Modal,
  ModalVariant,
  PageSection,
} from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { clusterTemplateGVK, helmRepoGVK } from '../constants';
import { ClusterTemplate } from '../types';
import { useClusterTemplates } from '../hooks/useClusterTemplates';
import { useClusterTemplateInstances } from '../hooks/useClusterTemplateInstances';
import { LoadingHelper } from '../utils';

const columns = [
  {
    title: 'Name',
    sort: 'metadata.name',
    transforms: [sortable],
    id: 'name',
  },
  {
    title: 'HELM repository',
    id: 'helm-repo',
  },
  {
    title: 'HELM chart',
    id: 'helm-chart',
  },
  {
    title: 'Setup pipeline',
    id: 'pipeline',
  },
  {
    title: 'Template uses',
    id: 'usage',
  },
  {
    title: '',
    id: 'kebab-menu',
    props: { className: 'pf-c-table__action' },
  },
];

const TemplateRow: React.FC<RowProps<ClusterTemplate>> = ({ obj, activeColumnIDs }) => {
  const [isOpen, setOpen] = React.useState(false);
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const [model] = useK8sModel(clusterTemplateGVK);
  const [instances, loaded, loadError] = useClusterTemplateInstances();

  return (
    <>
      <TableData id="name" activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          groupVersionKind={clusterTemplateGVK}
          name={obj.metadata?.name}
          namespace={obj.metadata?.namespace}
        />
      </TableData>
      <TableData id="helm-repo" activeColumnIDs={activeColumnIDs}>
        <ResourceLink groupVersionKind={helmRepoGVK} name={obj.spec.helmChartRef.repository} />
      </TableData>
      <TableData id="helm-chart" activeColumnIDs={activeColumnIDs}>
        {obj.spec.helmChartRef?.name}
      </TableData>
      <TableData id="pipeline" activeColumnIDs={activeColumnIDs}>
        {obj.spec.clusterSetup.pipeline?.name}
      </TableData>
      <TableData id="usage" activeColumnIDs={activeColumnIDs}>
        <LoadingHelper isLoaded={loaded} error={loadError}>
          {instances.filter((i) => i.spec.template === obj.metadata?.name).length}
        </LoadingHelper>
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
              Delete ClusterTemplate
            </DropdownItem>,
          ]}
          position="right"
        />
      </TableData>
      {isDeleteOpen && (
        <Modal
          variant={ModalVariant.small}
          isOpen
          title="Delete ClusterTemplate"
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

const ClusterTemplatesTab = () => {
  const [templates, loaded, loadError] = useClusterTemplates();

  return (
    <PageSection>
      <VirtualizedTable<ClusterTemplate>
        data={templates}
        unfilteredData={templates}
        columns={columns}
        Row={TemplateRow}
        loaded={loaded}
        loadError={loadError}
      />
    </PageSection>
  );
};

export default ClusterTemplatesTab;

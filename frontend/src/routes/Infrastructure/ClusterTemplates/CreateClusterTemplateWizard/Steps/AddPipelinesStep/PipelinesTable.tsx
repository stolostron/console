/* Copyright Contributors to the Open Cluster Management project */
import {
  K8sResourceCommon,
  ResourceLink,
  RowProps,
  TableData,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { sortable, Td } from '@patternfly/react-table';
import * as React from 'react';
import { useFormikContext } from 'formik';
import { pipelineGVK } from '../../../constants';
import { FormikValues } from '../../types';

const columns = [
  {
    title: '',
    props: { style: { width: '8.333%' } },
    id: 'check',
  },
  {
    title: 'Name',
    sort: 'metadata.name',
    transforms: [sortable],
    id: 'name',
  },
  {
    title: 'Namespace',
    sort: 'metadata.namespace',
    transforms: [sortable],
    id: 'namespace',
  },
  //{
  //  title: '',
  //  id: 'kebab-menu',
  //  props: { className: 'pf-c-table__action' },
  //},
];

const RowContext = React.createContext<{
  onSelect: (uid: string, isSelected: boolean) => void;
  selected: string[];
}>({
  onSelect: () => {},
  selected: [],
});

const PipelineRow: React.FC<RowProps<K8sResourceCommon>> = ({ obj, activeColumnIDs }) => {
  const { onSelect, selected } = React.useContext(RowContext);
  return (
    <>
      <Td
        select={{
          rowIndex: 0,
          onSelect: (_, isSelected) => onSelect(obj.metadata?.uid || '', isSelected),
          isSelected: selected.some((s) => s === obj.metadata?.uid),
        }}
      />
      <TableData id="name" activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          groupVersionKind={pipelineGVK}
          name={obj.metadata?.name}
          namespace={obj.metadata?.namespace}
        />
      </TableData>
      <TableData id="name" activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          groupVersionKind={{
            kind: 'Namespace',
            version: 'v1',
          }}
          name={obj.metadata?.namespace}
        />
      </TableData>
    </>
  );
};

const PipelinesTable = () => {
  const [pipelines, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: pipelineGVK,
    isList: true,
  });
  const { values, setFieldValue } = useFormikContext<FormikValues>();

  return (
    <RowContext.Provider
      value={{
        onSelect: (uid: string, isSelected: boolean) => {
          setFieldValue(
            'pipelines',
            isSelected ? [...values.pipelines, uid] : values.pipelines.filter((p) => p !== uid),
          );
        },
        selected: values.pipelines,
      }}
    >
      <VirtualizedTable
        Row={PipelineRow}
        unfilteredData={pipelines}
        data={pipelines}
        columns={columns}
        loadError={loadError}
        loaded={loaded}
      />
    </RowContext.Provider>
  );
};

export default PipelinesTable;

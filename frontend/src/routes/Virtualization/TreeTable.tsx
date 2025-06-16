/* Copyright Contributors to the Open Cluster Management project */
import { Table, Thead, Tr, Th, Tbody, Td, TreeRowWrapper, TdProps, ActionsColumn } from '@patternfly/react-table'
import { useCallback, useContext, useMemo, useState } from 'react'
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon'
import ProjectDiagramIcon from '@patternfly/react-icons/dist/esm/icons/project-diagram-icon'
import VirtualMachineIcon from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon'
import { ISearchResult } from '../Search/SearchResults/utils'
import { PluginContext } from '../../lib/PluginContext'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import {
  DeleteExternalResourceModal,
  ClosedDeleteExternalResourceModalProps,
  IDeleteExternalResourceModalProps,
} from '../Search/components/Modals/DeleteExternalResourceModal'
import {
  DeleteResourceModal,
  ClosedDeleteModalProps,
  IDeleteModalProps,
} from '../Search/components/Modals/DeleteResourceModal'
import {
  VMActionModal,
  ClosedVMActionModalProps,
  IVMActionModalProps,
} from '../Infrastructure/VirtualMachines/modals/VMActionModal'
import {
  getVirtualMachineRowActions,
  getVirtualMachineRowActionExtensions,
} from '../Infrastructure/VirtualMachines/utils'
import { useSharedAtoms } from '../../shared-recoil'
import { PageSection, Toolbar, ToolbarGroup, ToolbarContent, TextInput, ToolbarItem } from '@patternfly/react-core'
import { DropdownBasic } from './TreeTableDropdownMenu'
import { MigrateModal } from './MigrateModal'
import { NavigationPath } from '../../NavigationPath'
import { AcmLabels } from '../../ui-components'

export interface ISearchResultVM {
  kind: string
  apiversion: string
  name: string
  apigroup?: string
  __type: string
  _uid: string
  status: string
  cpu: string
  memory: string
  disk: string
  ipaddress: string
  labels: string
}

type TreeNode = {
  name: string
  type: 'cluster' | 'namespace' | 'vm'
  children?: TreeNode[]
  raw?: ISearchResultVM
}

function groupVMs(vms: ISearchResultVM[]): TreeNode[] {
  const grouped: Record<string, Record<string, TreeNode[]>> = {}

  for (const vm of vms) {
    const cluster = (vm as any).cluster ?? 'unknown-cluster'
    const namespace = (vm as any).namespace ?? 'unknown-namespace'

    if (!grouped[cluster]) grouped[cluster] = {}
    if (!grouped[cluster][namespace]) grouped[cluster][namespace] = []
    grouped[cluster][namespace].push({
      name: vm.name,
      type: 'vm',
      raw: vm,
    })
  }

  return Object.entries(grouped).map(([clusterName, namespaces]) => ({
    name: clusterName,
    type: 'cluster',
    children: Object.entries(namespaces).map(([nsName, vms]) => ({
      name: nsName,
      type: 'namespace',
      children: vms,
    })),
  }))
}

export default function VirtualMachineTreeTable({
  searchResultItems,
}: {
  searchResultItems: ISearchResultVM[] | undefined
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { acmExtensions } = useContext(PluginContext)
  const { useVirtualMachineActionsEnabled } = useSharedAtoms()
  const vmActionsEnabled = useVirtualMachineActionsEnabled()
  const allClusters = useAllClusters(true)

  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )
  const [VMAction, setVMAction] = useState<IVMActionModalProps>(ClosedVMActionModalProps)
  const [pluginModal, setPluginModal] = useState<JSX.Element>()
  const [expanded, setExpanded] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false)

  const openMigrateModal = () => setIsMigrateModalOpen(true)
  const closeMigrateModal = () => setIsMigrateModalOpen(false)
  const handleMigrateConfirm = () => {
    console.log('Navigating with:', selected)
    navigate(NavigationPath.migration, { state: { vmIds: selected } })
    closeMigrateModal()
  }

  const treeData = useMemo(() => groupVMs(searchResultItems || []), [searchResultItems])

  const toggleExpanded = (name: string) =>
    setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))

  const toggleChecked = (node: TreeNode) => {
    const getDescendants = (n: TreeNode): string[] =>
      n.children ? n.children.flatMap(getDescendants) : n.type === 'vm' && n.raw?._uid ? [n.raw._uid] : []

    const vmIds = getDescendants(node)
    const allSelected = vmIds.every((id) => selected.includes(id))

    const newSelected = allSelected
      ? selected.filter((id) => !vmIds.includes(id))
      : [...new Set([...selected, ...vmIds])]
    console.log('Selected VM UIDs:', newSelected)
    setSelected(newSelected)
  }

  const getDescendants = (n: TreeNode): string[] =>
    n.children ? n.children.flatMap(getDescendants) : n.type === 'vm' && n.raw?._uid ? [n.raw._uid] : []
  const isNodeChecked = (node: TreeNode): boolean | null => {
    const all = getDescendants(node)
    const checkedCount = all.filter((id) => selected.includes(id)).length
    if (checkedCount === 0) return false
    if (checkedCount === all.length) return true
    return null
  }
  const resolveVmActions = useCallback(
    (item: ISearchResult) =>
      getVirtualMachineRowActions(
        item,
        allClusters,
        setDeleteResource,
        setDeleteExternalResource,
        setVMAction,
        vmActionsEnabled,
        navigate,
        t,
        getVirtualMachineRowActionExtensions(item, acmExtensions?.virtualMachineAction || [], setPluginModal)
      ),
    [
      allClusters,
      acmExtensions,
      navigate,
      setDeleteResource,
      setDeleteExternalResource,
      setVMAction,
      setPluginModal,
      t,
      vmActionsEnabled,
    ]
  )

  const renderRows = (nodes: TreeNode[], level = 1): React.ReactNode[] => {
    return nodes.flatMap((node, index) => {
      const isExpanded = node.type !== 'vm' && expanded.includes(node.name)
      const icon =
        node.type === 'cluster' ? (
          <CubeIcon />
        ) : node.type === 'namespace' ? (
          <ProjectDiagramIcon />
        ) : (
          <VirtualMachineIcon />
        )

      const isChecked = isNodeChecked(node)

      const treeRow: TdProps['treeRow'] = {
        onCollapse: () => toggleExpanded(node.name),
        onCheckChange: () => toggleChecked(node),
        rowIndex: index,
        props: {
          isExpanded,
          isHidden: false,
          'aria-level': level,
          'aria-posinset': index + 1,
          'aria-setsize': nodes.length,
          isChecked,
          checkboxId: `checkbox-${node.name}`,
          icon,
          isLeaf: node.type === 'vm',
        },
      }

      const cells = [
        <Td key="name" treeRow={treeRow} dataLabel="Name">
          {node.name}
        </Td>,
        <Td key="status" dataLabel="Status">
          {node.type === 'vm' ? node.raw?.status || '-' : ''}
        </Td>,
        <Td key="cpu" dataLabel="CPU usage">
          {node.type === 'vm' ? node.raw?.cpu || '-' : ''}
        </Td>,
        <Td key="memory" dataLabel="Memory usage">
          {node.type === 'vm' ? node.raw?.memory || '-' : ''}
        </Td>,
        <Td key="disk" dataLabel="Disk usage">
          {node.type === 'vm' ? node.raw?.disk || '-' : ''}
        </Td>,
        <Td key="ip" dataLabel="IP usage">
          {node.type === 'vm' ? node.raw?.ipaddress || '-' : ''}
        </Td>,
        <Td key="labels" dataLabel="Labels">
          {node.type === 'vm' ? (
            <AcmLabels
              labels={
                node.raw?.labels
                  ? node.raw.labels
                      .split(';')
                      .map((label: string) => label.trim())
                      .filter(Boolean)
                  : undefined
              }
              isCompact
            />
          ) : (
            ''
          )}
        </Td>,
      ]

      if (node.type === 'vm' && node.raw) {
        const rawActions = resolveVmActions(node.raw)

        const vmActions = rawActions.map((action) => ({
          title: action.title,
          itemKey: action.id,
          onClick: () => {
            action.click?.(node.raw)
          },
          tooltipProps: action.tooltip ? { content: action.tooltip } : undefined,
        }))

        cells.push(
          <Td key="actions" isActionCell>
            <ActionsColumn items={vmActions} />
          </Td>
        )
      }

      const row = (
        <TreeRowWrapper key={node.name} row={{ props: treeRow.props }}>
          {cells}
        </TreeRowWrapper>
      )

      const children = isExpanded && node.children ? renderRows(node.children, level + 1) : []

      return [row, ...children]
    })
  }

  return (
    <>
      <MigrateModal
        open={isMigrateModalOpen}
        onClose={closeMigrateModal}
        selectedIds={selected}
        onConfirm={handleMigrateConfirm}
      />
      {pluginModal}
      <VMActionModal {...VMAction} />
      <DeleteResourceModal {...deleteResource} />
      <DeleteExternalResourceModal {...deleteExternalResource} />

      <PageSection>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <TextInput
                  //   value={filter}
                  //   onChange={setFilter}
                  placeholder={t('Filter by name')}
                  aria-label="Filter by name"
                />
              </ToolbarItem>
              <ToolbarItem>
                <DropdownBasic openMigrateModal={openMigrateModal} />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>

        <Table isTreeTable aria-label="VirtualMachine Tree Table">
          <Thead>
            <Tr>
              <Th width={20}>Name</Th>
              <Th width={10}>Status</Th>
              <Th width={10}>CPU usage</Th>
              <Th width={10}>Memory usage</Th>
              <Th width={10}>Disk usage</Th>
              <Th width={10}>IP usage</Th>
              <Th width={10}>Labels</Th>
              <Th width={10}> </Th>
            </Tr>
          </Thead>
          <Tbody>{renderRows(treeData)}</Tbody>
        </Table>
      </PageSection>
    </>
  )
}

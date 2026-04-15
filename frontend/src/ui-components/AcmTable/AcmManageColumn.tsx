/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  Content,
  DataList,
  DataListCell,
  DataListCheck,
  DataListControl,
  DataListDragButton,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Tooltip,
} from '@patternfly/react-core'
import { DragDrop, Draggable, Droppable, Modal } from '@patternfly/react-core/deprecated'
import ColumnsIcon from '@patternfly/react-icons/dist/js/icons/columns-icon'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { compareStrings } from './AcmTable'
import { IAcmTableColumn } from './AcmTableTypes'
import { setColumnValues } from './localColumnStorage'

interface AcmManageColumnProps<T> {
  allCols: IAcmTableColumn<T>[]
  selectedColIds: string[]
  setSelectedColIds: (selectedIds: string[]) => void
  requiredColIds: string[]
  defaultColIds?: string[]
  setColOrderIds: (colOrderIds: string[]) => void
  colOrderIds: string[]
}

export function AcmManageColumn<T>({
  allCols,
  selectedColIds,
  colOrderIds,
  setColOrderIds,
  setSelectedColIds,
  requiredColIds,
  defaultColIds,
}: AcmManageColumnProps<T>) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const { t } = useTranslation()

  /**
   * Stable key so `ManageColumnModal` remounts when the set of manageable column ids changes
   * (e.g. an async/conditional column appears). Ensures `useState` initializers see the current `allCols`.
   */
  const manageableColumnIdsKey = useMemo(
    () =>
      allCols
        .filter((c) => c.id && !c.isActionCol)
        .map((c) => c.id as string)
        .sort((a, b) => compareStrings(a, b))
        .join('|'),
    [allCols]
  )

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen)
  }

  return (
    <>
      <ManageColumnModal<T>
        key={manageableColumnIdsKey}
        {...{
          isModalOpen,
          selectedColIds,
          allCols,
          setSelectedColIds,
          requiredColIds,
          defaultColIds,
          setColOrderIds,
          colOrderIds,
        }}
        toggleModal={toggleModal}
      />
      <Tooltip content={t('Manage columns')} enableFlip trigger="mouseenter" position="top" exitDelay={50}>
        <Button isInline variant="plain" onClick={toggleModal} icon={<ColumnsIcon />} aria-label="columns-management" />
      </Tooltip>
    </>
  )
}

function reorder<T>(list: IAcmTableColumn<T>[], startIndex: number, endIndex: number) {
  const result = list
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return [...result]
}

/**
 * Builds the list of columns shown in the manage-columns modal: follow `colOrderIds`, then append
 * any manageable columns from `allCols` that were not listed (new columns, or ids missing from storage).
 * Action columns and columns without `id` are excluded.
 *
 * @param colOrderIds - Saved order from `AcmTable` / localStorage.
 * @param allCols - Current column definitions from the table (non-action, with ids).
 * @returns Ordered columns for the modal data list.
 */
export function sortColumnsForManageModal<T>(colOrderIds: string[], allCols: IAcmTableColumn<T>[]) {
  const manageable = allCols.filter((col) => col.id && !col.isActionCol)
  const sortedColumns: IAcmTableColumn<T>[] = []
  const seen = new Set<string>()
  colOrderIds.forEach((id) => {
    if (!id || seen.has(id)) {
      return
    }
    const find = manageable.find((col) => col.id === id)
    if (find) {
      sortedColumns.push(find)
      seen.add(id)
    }
  })
  const remaining = manageable
    .filter((col) => !seen.has(col.id as string))
    .sort((a, b) => {
      if (a.order == null && b.order == null) return 0
      if (a.order == null) return 1
      if (b.order == null) return -1
      return a.order - b.order
    })
  return [...sortedColumns, ...remaining]
}

interface ManageColumnModalProps<T> {
  isModalOpen: boolean
  toggleModal: () => void
  selectedColIds: string[]
  setSelectedColIds: (selectedIds: string[]) => void
  allCols: IAcmTableColumn<T>[]
  requiredColIds: string[]
  defaultColIds?: string[]
  colOrderIds: string[]
  setColOrderIds: (colOrderIds: string[]) => void
  tableId?: string
}

function ManageColumnModal<T>(props: ManageColumnModalProps<T>) {
  const { t } = useTranslation()
  const {
    isModalOpen,
    toggleModal,
    allCols,
    selectedColIds,
    setSelectedColIds,
    colOrderIds,
    setColOrderIds,
    requiredColIds,
    defaultColIds,
    tableId,
  } = props
  const [items, setItems] = useState<IAcmTableColumn<T>[]>(() => sortColumnsForManageModal(colOrderIds, allCols))
  const [localSelectedIds, setlocalSelectedIds] = useState<string[]>(selectedColIds)

  /**
   * When the modal opens, refresh from parent props so the list matches the table after `allCols`
   * has changed since the initial `ManageColumnModal` mount (without relying on a ref).
   * Dependencies are only `isModalOpen` so drag-and-drop and checkbox edits are not reset on unrelated
   * parent re-renders while the modal stays open.
   */
  useEffect(() => {
    if (!isModalOpen) {
      return
    }
    setItems(sortColumnsForManageModal(colOrderIds, allCols))
    setlocalSelectedIds(selectedColIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only on open/close; see JSDoc above
  }, [isModalOpen])

  const onDrop = (source: any, dest?: any) => {
    if (dest) {
      const newItems = reorder<T>(items, source.index, dest.index)
      setItems(newItems)
      return true
    } else {
      return false
    }
  }

  const handleChange = (checked: boolean, event: FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.name
    if (checked) {
      setlocalSelectedIds([...localSelectedIds, value])
    } else {
      setlocalSelectedIds(localSelectedIds.filter((id) => id !== value))
    }
  }

  const onSave = () => {
    setSelectedColIds(localSelectedIds)
    const order = items.map((col) => col.id!)
    setColOrderIds(order)
    setColumnValues(tableId || '', localSelectedIds, order)
    toggleModal()
  }

  const restoreDefault = () => {
    setlocalSelectedIds(defaultColIds || requiredColIds)
    setItems(
      [...allCols]
        .filter((col) => col.id && !col.isActionCol)
        .sort((a, b) => {
          return a.order != null && b.order != null ? a.order - b.order : -1
        })
    )
  }

  /** Discard local edits and align with parent state (also runs when the modal is dismissed). */
  const onClose = () => {
    toggleModal()
    setlocalSelectedIds(selectedColIds)
    setItems(sortColumnsForManageModal(colOrderIds, allCols))
  }

  return (
    <Modal
      title={t('Manage columns')}
      isOpen={isModalOpen}
      variant="small"
      description={
        <Content>
          <Content component="p">
            {t('Selected columns will appear in the table. Drag and drop the columns to reorder them.')}
          </Content>
        </Content>
      }
      onClose={onClose}
      actions={[
        <Button key="save" variant="primary" onClick={onSave}>
          {t('Save')}
        </Button>,
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>,
        <Button key="restore" variant="link" onClick={restoreDefault}>
          {t('Restore defaults')}
        </Button>,
      ]}
    >
      <DragDrop onDrop={onDrop}>
        <Droppable hasNoWrapper>
          <DataList aria-label="Table column management" id="table-column-management" isCompact>
            {items.map((policy) => (
              <Draggable key={policy.id} hasNoWrapper>
                <DataListItem aria-labelledby={`table-column-management-${policy.id}`} id={policy.id}>
                  <DataListItemRow>
                    <DataListControl>
                      <DataListDragButton
                        aria-label="Reorder"
                        aria-labelledby={`table-column-management-${policy.id}`}
                        aria-describedby={t(
                          'Press space or enter to begin dragging, and use the arrow keys to navigate up or down. Press enter to confirm the drag, or any other key to cancel the drag operation.'
                        )}
                        aria-pressed="false"
                      />
                      <DataListCheck
                        aria-labelledby={`table-column-management-${policy.id}`}
                        isChecked={
                          requiredColIds.includes(policy.id as string) || localSelectedIds.includes(policy.id as string)
                        }
                        isDisabled={requiredColIds.includes(policy.id!)}
                        name={policy.id}
                        id={`checkbox-${policy.id}`}
                        onChange={(event, checked: boolean) => handleChange(checked, event)}
                        otherControls
                      />
                    </DataListControl>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell
                          id={`table-column-management-${policy.id}`}
                          key={`table-column-management-${policy.id}`}
                        >
                          <label htmlFor={`checkbox-${policy.id}`}>{policy.header}</label>
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              </Draggable>
            ))}
          </DataList>
        </Droppable>
      </DragDrop>
    </Modal>
  )
}

/* Copyright Contributors to the Open Cluster Management project */
import { FormEvent, useState } from 'react'
import {
  Button,
  DataList,
  DataListCheck,
  DataListControl,
  DataListDragButton,
  DataListItem,
  DataListItemRow,
  Modal,
  TextContent,
  Tooltip,
  Text,
  DataListItemCells,
  DataListCell,
  DragDrop,
  Droppable,
  Draggable,
} from '@patternfly/react-core'
import { IAcmTableColumn } from './AcmTable'
import { useTranslation } from '../../lib/acm-i18next'
import ColumnsIcon from '@patternfly/react-icons/dist/js/icons/columns-icon'

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

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen)
  }

  return (
    <>
      <ManageColumnModal<T>
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

function sortByList<T>(colOrderIds: string[], items: IAcmTableColumn<T>[]) {
  // sort listed column by saved column order
  const sortedColumns: IAcmTableColumn<T>[] = []
  colOrderIds.forEach((id) => {
    const find = items.find((col) => col.id === id)
    if (find) {
      sortedColumns.push(find)
    }
  })
  return sortedColumns
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
  } = props
  const [items, setItems] = useState<IAcmTableColumn<T>[]>(sortByList(colOrderIds, allCols))
  const [localSelectedIds, setlocalSelectedIds] = useState<string[]>(selectedColIds)

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
    setColOrderIds(items.map((col) => col.id!))
    toggleModal()
  }

  const restoreDefault = () => {
    setlocalSelectedIds(defaultColIds || requiredColIds)
    const sortedItems = [...items].sort((a, b) => {
      return a.order != null && b.order != null ? a.order - b.order : -1
    })
    setItems(sortedItems)
  }

  const onClose = () => {
    toggleModal()
    setlocalSelectedIds(selectedColIds)
    // sort listed column by saved column order
    setItems(sortByList(colOrderIds, items))
  }

  return (
    <Modal
      title={t('Manage columns')}
      isOpen={isModalOpen}
      variant="small"
      description={
        <TextContent>
          <Text>{t('Selected columns will appear in the table. Drag and drop the columns to reorder them.')}</Text>
        </TextContent>
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
                        checked={
                          requiredColIds.includes(policy.id as string) || localSelectedIds.includes(policy.id as string)
                        }
                        isDisabled={requiredColIds.includes(policy.id!)}
                        name={policy.id}
                        id={`checkbox-${policy.id}`}
                        onChange={handleChange}
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

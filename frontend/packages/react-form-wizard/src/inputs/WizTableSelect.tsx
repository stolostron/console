import {
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Dropdown,
    DropdownItem,
    EmptyState,
    EmptyStateBody,
    List,
    ListItem,
    OnSetPage,
    Pagination,
    PaginationVariant,
    EmptyStateHeader,
    MenuToggleCheckbox,
    MenuToggleElement,
    MenuToggle,
    DropdownList,
} from '@patternfly/react-core'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { Fragment, ReactNode, useCallback, useMemo, useState } from 'react'
import { Indented } from '../components/Indented'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useStringContext } from '../contexts/StringContext'
import { InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

interface ITableColumn<T> {
    name: string
    cellFn: (item: T) => ReactNode
}

export type WizTableSelectProps<T> = InputCommonProps<string> & {
    label: string
    columns: ITableColumn<T>[]
    items: T[]
    itemToValue?: (item: T) => unknown
    valueMatchesItem?: (value: unknown, item: T) => boolean
    emptyTitle: string
    emptyMessage: string
    summaryList?: boolean
}

export function WizTableSelect<T = any>(props: WizTableSelectProps<T>) {
    const { displayMode: mode, value, setValue, hidden, id } = useInput(props)

    const [page, setPage] = useState(1)
    const onSetPage = useCallback<OnSetPage>((_: unknown, page) => setPage(page), [])

    const pagedItems = useMemo(() => {
        return props.items.slice((page - 1) * 10, page * 10)
    }, [page, props.items])

    let values = value as unknown[]
    if (!Array.isArray(values)) values = []
    let selectedItems: T[] = values
    if (props.valueMatchesItem)
        selectedItems = values
            .map((value) => props.items.find((item) => (props.valueMatchesItem ? props.valueMatchesItem(value, item) : false)))
            .filter((item) => item !== undefined) as T[]

    const onSelect = useCallback(
        (item: T, select: boolean) => {
            if (select) {
                if (!selectedItems.includes(item)) {
                    setValue([
                        ...(props.itemToValue ? selectedItems.map(props.itemToValue) : selectedItems),
                        props.itemToValue ? props.itemToValue(item) : pagedItems,
                    ])
                }
            } else {
                if (props.itemToValue) {
                    setValue(selectedItems.filter((i) => i !== item).map(props.itemToValue))
                } else {
                    setValue(selectedItems.filter((i) => i !== item))
                }
            }
        },
        [pagedItems, props, selectedItems, setValue]
    )
    const isSelected = useCallback((item: T) => selectedItems.includes(item), [selectedItems])

    const selectAll = useCallback(
        () => setValue(props.itemToValue ? props.items.map(props.itemToValue) : props.items),
        [props.items, props.itemToValue, setValue]
    )
    const selectPage = useCallback(() => {
        let newValue = [
            ...(props.itemToValue ? selectedItems.map(props.itemToValue) : selectedItems),
            ...(props.itemToValue ? pagedItems.map(props.itemToValue) : pagedItems),
        ]
        newValue = newValue.filter(onlyUnique)
        setValue(newValue)
    }, [pagedItems, props.itemToValue, selectedItems, setValue])
    const selectNone = useCallback(() => setValue([]), [setValue])

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!selectedItems.length) return <Fragment />
        if (!props.label) {
            if (values.length > 5) {
                return <div id={id}>{values.length} selected</div>
            }
            return (
                <List isPlain={props.summaryList !== true}>
                    {values.map((value, index) => (
                        <ListItem key={index} style={{ paddingBottom: 4 }}>
                            {value}
                        </ListItem>
                    ))}
                </List>
            )
        }
        if (values.length > 5) {
            return (
                <DescriptionListGroup>
                    <DescriptionListTerm>{props.label}</DescriptionListTerm>
                    <DescriptionListDescription id={id}>{values.length} selected</DescriptionListDescription>
                </DescriptionListGroup>
            )
        }
        return (
            <Fragment>
                <div className="pf-v5-c-description-list__term">{props.label}</div>
                <Indented paddingBottom={4}>
                    <List style={{ marginTop: -4 }} isPlain={props.summaryList !== true}>
                        {values.map((value, index) => (
                            <ListItem key={index} style={{ paddingBottom: 4 }}>
                                {value}
                            </ListItem>
                        ))}
                    </List>
                </Indented>
            </Fragment>
        )
    }

    if (props.items.length === 0) {
        return (
            <EmptyState>
                <EmptyStateHeader titleText={<>{props.emptyTitle}</>} headingLevel="h4" />
                <EmptyStateBody>{props.emptyMessage}</EmptyStateBody>
            </EmptyState>
        )
    }

    return (
        <WizFormGroup {...props}>
            <div style={{ display: 'flex', gap: 8 }}>
                <BulkSelect
                    selectedCount={selectedItems.length}
                    selectAll={selectAll}
                    selectPage={selectPage}
                    selectNone={selectNone}
                    perPage={10}
                    total={props.items.length}
                />
                {/* <SearchInput style={{ flexGrow: 1 }} /> */}
            </div>
            <Table aria-label={props.label} variant="compact" id={id}>
                <Thead>
                    <Tr>
                        <Th />
                        {props.columns.map((column) => (
                            <Th key={column.name}>{column.name}</Th>
                        ))}
                    </Tr>
                </Thead>
                <Tbody>
                    {pagedItems.map((item, index) => (
                        <Tr key={index}>
                            <Td
                                select={{
                                    rowIndex: index,
                                    onSelect: (_event, isSelecting) => onSelect(item, isSelecting),
                                    isSelected: isSelected(item),
                                }}
                            />
                            {props.columns.map((column) => (
                                <Td key={column.name}>{column.cellFn(item)}</Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
            {props.items.length > 10 && (
                <Pagination
                    itemCount={props.items.length}
                    perPage={10}
                    variant={PaginationVariant.bottom}
                    page={page}
                    onSetPage={onSetPage}
                    perPageOptions={[]}
                />
            )}
        </WizFormGroup>
    )
}

function BulkSelect(props: {
    selectedCount: number
    total: number
    perPage: number
    selectNone: () => void
    selectPage: () => void
    selectAll: () => void
}) {
    const [open, setOpen] = useState(false)
    const onDropDownToggle = useCallback(() => setOpen((open) => !open), [])
    const { selected, selectNoItems, selectPageItems, selectAllItems } = useStringContext()
    const allSelected = props.selectedCount === props.total
    const anySelected = props.selectedCount > 0
    const someChecked = props.selectedCount ? null : false
    const isChecked = allSelected ? true : someChecked

    const items = useMemo(() => {
        const dropdownItems = [
            <DropdownItem key="item-1" onClick={props.selectNone}>
                {selectNoItems}
            </DropdownItem>,
        ]
        if (props.total > props.perPage) {
            dropdownItems.push(
                <DropdownItem key="item-2" onClick={props.selectPage}>
                    {selectPageItems(props.perPage)}
                </DropdownItem>
            )
        }
        dropdownItems.push(
            <DropdownItem key="item-3" onClick={props.selectAll}>
                {selectAllItems(props.total)}
            </DropdownItem>
        )
        return dropdownItems
    }, [props.perPage, props.selectAll, props.selectNone, props.selectPage, props.total, selectPageItems, selectAllItems, selectNoItems])

    const { selectNone, selectAll } = props
    const onCheckbox = useCallback(() => {
        anySelected ? selectNone() : selectAll()
    }, [anySelected, selectNone, selectAll])

    const { deselectAllAriaLabel, selectAllAriaLabel } = useStringContext()

    const toggle = useCallback(
        (toggleRef: React.Ref<MenuToggleElement>) => {
            return (
                <MenuToggle
                    ref={toggleRef}
                    onClick={onDropDownToggle}
                    splitButtonOptions={{
                        items: [
                            <MenuToggleCheckbox
                                id="example-checkbox-2"
                                key="split-checkbox"
                                aria-label={anySelected ? deselectAllAriaLabel : selectAllAriaLabel}
                                isChecked={isChecked}
                                onChange={onCheckbox}
                            >
                                {props.selectedCount !== 0 && <Fragment>{selected(props.selectedCount)}</Fragment>}
                            </MenuToggleCheckbox>,
                        ],
                    }}
                />
            )
        },
        [anySelected, deselectAllAriaLabel, isChecked, onCheckbox, onDropDownToggle, props.selectedCount, selectAllAriaLabel, selected]
    )

    return (
        <Dropdown onSelect={onDropDownToggle} toggle={toggle} isOpen={open} onOpenChange={setOpen} popperProps={{ position: 'left' }}>
            <DropdownList>{items}</DropdownList>
        </Dropdown>
    )
}

function onlyUnique(value: unknown, index: number, self: unknown[]) {
    return self.indexOf(value) === index
}

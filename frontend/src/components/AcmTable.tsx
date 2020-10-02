import {
    Button,
    Pagination,
    PaginationVariant,
    SearchInput,
    Split,
    SplitItem,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
} from '@patternfly/react-core'
import {
    ICell,
    IExtraRowData,
    IRow,
    IRowData,
    ISortBy,
    SortByDirection,
    Table,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table'
import Fuse from 'fuse.js'
import React, { FormEvent, Fragment, useLayoutEffect, useState } from 'react'

export interface IAcmTableAction<T> {
    id: string
    title: string | React.ReactNode
    click: () => void
}

export interface IAcmRowAction<T> {
    id: string
    title: string | React.ReactNode
    click: (item: T) => void
}

export interface IAcmTableBulkAction<T> {
    id: string
    title: string | React.ReactNode
    click: (items: T[]) => void
}

export function AcmTable<T>(props: {
    plural: string
    items: T[]
    columns: ICell[]
    searchKeys: string[]
    sortFn: (items: T[], column: number) => T[]
    keyFn: (item: T) => string
    cellsFn: (item: T) => React.ReactNode[]
    tableActions: IAcmTableAction<T>[]
    rowActions: IAcmRowAction<T>[]
    bulkActions: IAcmTableBulkAction<T>[]
}) {
    const { items, columns, sortFn, keyFn, cellsFn } = props
    const [filtered, setFiltered] = useState<T[]>(props.items)
    const [sorted, setSorted] = useState<T[]>()
    const [paged, setPaged] = useState<T[]>()
    const [rows, setRows] = useState<IRow[] | undefined>([])
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<ISortBy | undefined>({ index: 1, direction: SortByDirection.asc })
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [selected, setSelected] = useState<{ [uid: string]: Boolean }>({})

    useLayoutEffect(() => {
        if (search && search !== '') {
            const fuse = new Fuse(items, {
                includeScore: true,
                threshold: 0.2,
                keys: props.searchKeys,
            })
            setFiltered(fuse.search(search).map((result) => result.item))
            setSort(undefined)
        } else {
            setFiltered(items)
        }
    }, [search, items, props.searchKeys])

    useLayoutEffect(() => {
        if (sort && sort.index && filtered) {
            let sorted = sortFn([...filtered], sort.index)
            sorted = sort.direction === SortByDirection.asc ? sorted : sorted.reverse()
            setSorted(sorted)
        } else {
            setSorted(filtered)
        }
    }, [filtered, sort, sortFn])

    useLayoutEffect(() => {
        let start = (page - 1) * perPage
        if (start >= 0 && sorted && sorted.length > perPage) {
            let paged = [...sorted]
            if (start !== 0) {
                if (start >= paged.length) {
                    setPage(page - 1)
                } else {
                    paged = paged.slice(start)
                }
            }
            if (paged.length > perPage) {
                paged = paged.slice(0, perPage)
            }
            setPaged(paged)
        } else {
            setPaged(sorted)
        }
    }, [sorted, page, perPage])

    useLayoutEffect(() => {
        if (paged) {
            let newRows = paged.map((item) => {
                return {
                    selected: selected[keyFn(item)] === true,
                    props: { key: keyFn(item) },
                    cells: cellsFn(item),
                }
            })
            setRows(newRows)
        } else {
            setRows(undefined)
        }
    }, [selected, paged, keyFn, cellsFn])

    function onSelect(event: FormEvent, isSelected: boolean, rowId: number) {
        if (!paged) return
        if (!filtered) return
        if (!rows) return
        if (rowId === -1) {
            let allSelected = true
            for (const row of rows) {
                if (!row.selected) {
                    allSelected = false
                    break
                }
            }
            const newSelected: { [uid: string]: Boolean } = {}
            if (!allSelected) {
                for (const item of filtered) {
                    newSelected[keyFn(item)] = true
                }
            }
            setSelected(newSelected)
        } else {
            const newSelected = { ...selected }
            if (isSelected) {
                newSelected[keyFn(paged[rowId])] = true
            } else {
                delete newSelected[keyFn(paged[rowId])]
            }
            setSelected(newSelected)
        }
    }

    const actions = props.rowActions.map((rowAction) => {
        return {
            title: rowAction.title,
            onClick: (event: React.MouseEvent, rowId: number, rowData: IRowData, extra: IExtraRowData) => {
                if (paged) {
                    rowAction.click(paged[rowId])
                }
            },
        }
    })

    if (!rows) {
        return <></>
    }

    return (
        <Fragment>
            <Toolbar>
                <ToolbarContent>
                    <ToolbarItem>
                        <SearchInput
                            style={{ minWidth: '350px' }}
                            placeholder="Search"
                            value={search}
                            onChange={(value) => {
                                setSearch(value)
                                if (value === '') {
                                    if (!sort) {
                                        setSort({ index: 1, direction: SortByDirection.asc })
                                    }
                                }
                            }}
                            onClear={() => {
                                setSearch('')
                                setSort({ index: 1, direction: SortByDirection.asc })
                            }}
                            resultsCount={`${filtered?.length} / ${items.length}`}
                        />
                    </ToolbarItem>
                    <ToolbarItem alignment={{ default: 'alignRight' }}></ToolbarItem>
                    {Object.keys(selected).length ? (
                        <Fragment>
                            <ToolbarItem>
                                {Object.keys(selected).length}/{props.items.length} {props.plural} selected
                            </ToolbarItem>
                            <ToolbarItem variant="separator"></ToolbarItem>
                            {props.bulkActions.map((action) => (
                                <ToolbarItem key={action.id}>
                                    <Button
                                        onClick={(e) => {
                                            action.click(props.items.filter((item) => selected[keyFn(item)]))
                                        }}
                                    >
                                        {action.title}
                                    </Button>
                                </ToolbarItem>
                            ))}
                        </Fragment>
                    ) : (
                        <Fragment>
                            {props.tableActions.map((action) => (
                                <ToolbarItem key={action.id}>
                                    <Button
                                        onClick={(e) => {
                                            action.click()
                                        }}
                                    >
                                        {action.title}
                                    </Button>
                                </ToolbarItem>
                            ))}
                        </Fragment>
                    )}
                </ToolbarContent>
            </Toolbar>
            <Table
                cells={columns}
                rows={rows}
                actions={actions}
                canSelectAll={true}
                aria-label="Simple Table"
                sortBy={sort}
                onSort={(event, index, direction) => {
                    setSort({ index, direction })
                }}
                onSelect={onSelect}
                variant={TableVariant.compact}
            >
                <TableHeader />
                <TableBody />
            </Table>

            <Split>
                <SplitItem isFilled>
                    <Toolbar>
                        {/* <ToolbarContent>
                            <ToolbarItem>
                                <ToggleGroup>
                                    <ToggleGroupItem key={0} buttonId="first" isSelected={true}>
                                        Compact
                                    </ToggleGroupItem>
                                    <ToggleGroupItem key={0} buttonId="first" isSelected={false}>
                                        Compact
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </ToolbarItem>
                        </ToolbarContent> */}
                    </Toolbar>
                </SplitItem>
                <SplitItem>
                    <Pagination
                        hidden={filtered.length < perPage}
                        itemCount={filtered ? filtered.length : 0}
                        perPage={perPage}
                        page={page}
                        variant={PaginationVariant.bottom}
                        onSetPage={(event, page) => {
                            setPage(page)
                        }}
                        onPerPageSelect={(event, perPage) => {
                            setPerPage(perPage)
                        }}
                    ></Pagination>
                </SplitItem>
            </Split>
        </Fragment>
    )
}

export function compareStrings(a: string | undefined | null, b: string | undefined | null) {
    if (!a && !b) return 0
    if (!a) return 1
    if (!b) return -1
    return a < b ? -1 : a > b ? 1 : 0
}

export function compareNumbers(a: number | undefined | null, b: number | undefined | null) {
    if (!a && !b) return 0
    if (!a) return 1
    if (!b) return -1
    return a < b ? -1 : a > b ? 1 : 0
}

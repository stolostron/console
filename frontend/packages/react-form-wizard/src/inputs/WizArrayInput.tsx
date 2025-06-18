import {
    Button,
    Divider,
    Dropdown,
    DropdownList,
    DropdownItem,
    FormFieldGroupHeader,
    Icon,
    List,
    ListItem,
    MenuToggle,
    Split,
    SplitItem,
    Title,
    MenuToggleElement,
} from '@patternfly/react-core'
import { ArrowDownIcon, ArrowUpIcon, ExclamationCircleIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import get from 'get-value'
import { Fragment, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { WizTextDetail } from '..'
import { FieldGroup } from '../components/FieldGroup'
import { WizHelperText } from '../components/WizHelperText'
import { Indented } from '../components/Indented'
import { LabelHelp } from '../components/LabelHelp'
import { useData } from '../contexts/DataContext'
import { useStringContext } from '../contexts/StringContext'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { ItemContext } from '../contexts/ItemContext'
import { ShowValidationContext } from '../contexts/ShowValidationProvider'
import { HasValidationErrorContext, ValidationProvider } from '../contexts/ValidationProvider'
import { getCollapsedPlaceholder, InputCommonProps, useInput } from './Input'

export function wizardArrayItems(props: any, item: any) {
    const id = props.id
    const path = props.path !== undefined ? props.path : id
    let sourceArray = get(item, path as string) as object[]
    if (!Array.isArray(sourceArray)) sourceArray = []
    let values = sourceArray
    if (props.filter) values = values.filter(props.filter)
    return values
}

export type WizArrayInputProps = Omit<InputCommonProps, 'path'> & {
    path: string | null
    children: ReactNode
    filter?: (item: any) => boolean
    dropdownItems?: { label: string; action: () => object }[]
    placeholder?: string
    collapsedContent: ReactNode
    expandedContent?: ReactNode
    collapsedPlaceholder?: ReactNode
    sortable?: boolean
    newValue?: object
    defaultCollapsed?: boolean
    disallowEmpty?: boolean
    isSection?: boolean
    summaryList?: boolean
}

export function WizArrayInput(props: WizArrayInputProps) {
    const { displayMode: mode, value, setValue, hidden, id } = useInput(props as InputCommonProps)
    const [open, setOpen] = useState(false)
    const onToggle = useCallback(() => setOpen((open: boolean) => !open), [])

    const path = props.path

    const { update } = useData()
    const item = useContext(ItemContext)
    const values = wizardArrayItems(props, item)

    const addItem = useCallback(
        (newItem: object | object[]) => {
            if (path === null) {
                ;(item as any[]).push(newItem)
            } else {
                let newArray = values
                if (Array.isArray(newItem)) {
                    newArray = [...newArray, ...newItem]
                } else {
                    newArray.push(newItem as never)
                }
                setValue(newArray)
            }
            update()
        },
        [item, path, setValue, update, values]
    )

    if (!values.length && props.disallowEmpty) {
        addItem(props.newValue ?? {})
    }

    const removeItem = useCallback(
        (item: object) => {
            const index = (value as Array<object>).indexOf(item)
            if (index !== -1) {
                ;(value as Array<object>).splice(index, 1)
                setValue(value)
            }
        },
        [setValue, value]
    )

    const moveUp = useCallback(
        (index: number) => {
            const temp = value[index]
            value[index] = value[index - 1]
            value[index - 1] = temp
            setValue(value)
        },
        [setValue, value]
    )

    const moveDown = useCallback(
        (index: number) => {
            const temp = value[index]
            value[index] = value[index + 1]
            value[index + 1] = temp
            setValue(value)
        },
        [setValue, value]
    )

    const { actionAriaLabel } = useStringContext()

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (values.length === 0) {
            return <Fragment />
        }
        if (props.isSection) {
            return (
                <Fragment>
                    <Title headingLevel="h2">{props.label}</Title>
                    <Indented id={id}>
                        <List style={{ marginTop: -4 }} isPlain={props.summaryList !== true}>
                            {values.map((value, index) => (
                                <ListItem key={index} style={{ paddingBottom: 4 }}>
                                    <ItemContext.Provider value={value}>
                                        {typeof props.collapsedContent === 'string' ? (
                                            <WizTextDetail
                                                id={props.collapsedContent}
                                                path={props.collapsedContent}
                                                placeholder={props.collapsedPlaceholder}
                                            />
                                        ) : (
                                            props.collapsedContent
                                        )}
                                    </ItemContext.Provider>
                                </ListItem>
                            ))}
                        </List>
                    </Indented>
                </Fragment>
            )
        }
        return (
            <Fragment>
                <div className="pf-v5-c-description-list__term">{props.label}</div>
                <Indented id={id}>
                    <List style={{ marginTop: -4 }} isPlain={props.summaryList !== true}>
                        {values.map((value, index) => (
                            <ListItem key={index} style={{ paddingBottom: 4 }}>
                                <ItemContext.Provider value={value}>
                                    {typeof props.collapsedContent === 'string' ? (
                                        <WizTextDetail
                                            id={props.collapsedContent}
                                            path={props.collapsedContent}
                                            placeholder={props.collapsedPlaceholder}
                                        />
                                    ) : (
                                        props.collapsedContent
                                    )}
                                </ItemContext.Provider>
                            </ListItem>
                        ))}
                    </List>
                </Indented>
            </Fragment>
        )
    }
    return (
        <div id={id} className="form-wizard-array-input">
            {props.label && (
                <div style={{ paddingBottom: 8, paddingTop: 0 }}>
                    {props.isSection ? (
                        <Split hasGutter style={{ paddingBottom: 8 }}>
                            <span className="pf-v5-c-form__section-title">{props.label}</span>
                            {props.labelHelp && <LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />}
                        </Split>
                    ) : (
                        <div>
                            <span className="pf-v5-c-form__label pf-v5-c-form__label-text">{props.label}</span>
                            {props.labelHelp && <LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />}
                        </div>
                    )}
                    <WizHelperText {...props} />
                </div>
            )}
            {values.length === 0 ? (
                <Divider />
            ) : (
                values.map((value, index) => {
                    return (
                        <ArrayInputItem
                            key={index}
                            id={id}
                            value={value}
                            index={index}
                            count={values.length}
                            collapsedContent={props.collapsedContent}
                            expandedContent={props.expandedContent}
                            collapsedPlaceholder={props.collapsedPlaceholder}
                            sortable={props.sortable}
                            moveUp={moveUp}
                            moveDown={moveDown}
                            removeItem={removeItem}
                            defaultExpanded={!props.defaultCollapsed}
                        >
                            {props.children}
                        </ArrayInputItem>
                    )
                })
            )}
            {props.placeholder && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingTop: values.length ? 8 : 4 }}>
                    {!props.dropdownItems ? (
                        <Button
                            id="add-button"
                            variant="link"
                            size="sm"
                            aria-label={actionAriaLabel}
                            onClick={() => addItem(props.newValue ?? {})}
                            icon={<PlusCircleIcon />}
                        >
                            {props.placeholder}
                        </Button>
                    ) : (
                        <Dropdown
                            isOpen={open}
                            onOpenChange={setOpen}
                            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                                <MenuToggle ref={toggleRef} onClick={onToggle} variant="plainText">
                                    <Button icon={<PlusCircleIcon />} iconPosition="left" variant="link" size="sm">
                                        {props.placeholder}
                                    </Button>
                                </MenuToggle>
                            )}
                            popperProps={{ position: 'left' }}
                        >
                            <DropdownList>
                                {props.dropdownItems.map((item, index) => (
                                    <DropdownItem
                                        key={index}
                                        onClick={() => {
                                            addItem(item.action())
                                            setOpen(false)
                                        }}
                                    >
                                        {item.label}
                                    </DropdownItem>
                                ))}
                            </DropdownList>
                        </Dropdown>
                    )}
                </div>
            )}
        </div>
    )
}

export function ArrayInputItem(props: {
    id: string
    value: object
    index: number
    count: number
    children: ReactNode
    defaultExpanded?: boolean
    collapsedContent: ReactNode
    expandedContent?: ReactNode
    collapsedPlaceholder?: ReactNode
    sortable?: boolean
    moveUp: (index: number) => void
    moveDown: (index: number) => void
    removeItem: (value: object) => void
}) {
    const { id, value, index, defaultExpanded, moveUp, moveDown, removeItem } = props
    const [expanded, setExpanded] = useState(defaultExpanded !== undefined ? defaultExpanded : true)

    const collapsedContent = useMemo(() => {
        return typeof props.collapsedContent === 'string' ? (
            <WizTextDetail id={props.collapsedContent} path={props.collapsedContent} placeholder={getCollapsedPlaceholder(props)} />
        ) : (
            props.collapsedContent
        )
    }, [props])

    const expandedContent = useMemo(() => {
        if (props.expandedContent) {
            return typeof props.expandedContent === 'string' ? (
                <WizTextDetail id={props.expandedContent} path={props.expandedContent} />
            ) : (
                props.expandedContent
            )
        }
        return collapsedContent
    }, [collapsedContent, props.expandedContent])

    const {
        detailsAriaLabel,
        expandToFixValidationErrors,
        sortableMoveItemDownAriaLabel,
        sortableMoveItemUpAriaLabel,
        removeItemAriaLabel,
    } = useStringContext()

    return (
        <ValidationProvider>
            <ShowValidationContext.Consumer>
                {(showValidation) => (
                    <HasValidationErrorContext.Consumer>
                        {(hasErrors) => (
                            <ItemContext.Provider value={value}>
                                <FieldGroup
                                    id={id + '-' + (index + 1).toString()}
                                    isExpanded={expanded}
                                    setIsExpanded={setExpanded}
                                    toggleAriaLabel={detailsAriaLabel}
                                    header={
                                        <FormFieldGroupHeader
                                            titleText={{
                                                text:
                                                    showValidation && hasErrors ? (
                                                        <Split>
                                                            <SplitItem>
                                                                <Icon status="danger">
                                                                    <ExclamationCircleIcon />
                                                                </Icon>
                                                            </SplitItem>
                                                            <SplitItem>
                                                                <span className="pf-v5-c-form__helper-text pf-m-error">
                                                                    &nbsp; {expandToFixValidationErrors}
                                                                </span>
                                                            </SplitItem>
                                                        </Split>
                                                    ) : expanded ? (
                                                        <Fragment>{expandedContent}</Fragment>
                                                    ) : (
                                                        <Fragment>{collapsedContent}</Fragment>
                                                    ),

                                                id: `nested-field-group1-titleText-id-${index}`,
                                            }}
                                            // titleDescription={!hasErrors && props.collapsedDescription ? props.collapsedDescription : undefined}
                                            actions={
                                                <Fragment>
                                                    {props.sortable && (
                                                        <Fragment>
                                                            <Button
                                                                variant="plain"
                                                                aria-label={sortableMoveItemUpAriaLabel}
                                                                isDisabled={index === 0}
                                                                onClick={() => moveUp(index)}
                                                            >
                                                                <ArrowUpIcon />
                                                            </Button>
                                                            <Button
                                                                variant="plain"
                                                                aria-label={sortableMoveItemDownAriaLabel}
                                                                isDisabled={index === props.count - 1}
                                                                onClick={() => moveDown(index)}
                                                            >
                                                                <ArrowDownIcon />
                                                            </Button>
                                                        </Fragment>
                                                    )}
                                                    <Button
                                                        variant="plain"
                                                        aria-label={removeItemAriaLabel}
                                                        onClick={() => removeItem(props.value)}
                                                    >
                                                        <TrashIcon />
                                                    </Button>
                                                </Fragment>
                                            }
                                        />
                                    }
                                >
                                    <Split>
                                        <SplitItem isFilled>
                                            {expanded ? <Fragment>{expandedContent}</Fragment> : <Fragment>{collapsedContent}</Fragment>}
                                        </SplitItem>
                                        <SplitItem>
                                            {props.sortable && (
                                                <Fragment>
                                                    <Button
                                                        variant="plain"
                                                        aria-label={sortableMoveItemUpAriaLabel}
                                                        isDisabled={index === 0}
                                                        onClick={() => moveUp(index)}
                                                    >
                                                        <ArrowUpIcon />
                                                    </Button>
                                                    <Button
                                                        variant="plain"
                                                        aria-label={sortableMoveItemDownAriaLabel}
                                                        isDisabled={index === props.count - 1}
                                                        onClick={() => moveDown(index)}
                                                    >
                                                        <ArrowDownIcon />
                                                    </Button>
                                                </Fragment>
                                            )}
                                            <Button
                                                variant="plain"
                                                aria-label={removeItemAriaLabel}
                                                onClick={() => removeItem(props.value)}
                                                style={{ marginTop: -6 }}
                                            >
                                                <TrashIcon />
                                            </Button>
                                        </SplitItem>
                                    </Split>
                                    {props.children}
                                </FieldGroup>
                            </ItemContext.Provider>
                        )}
                    </HasValidationErrorContext.Consumer>
                )}
            </ShowValidationContext.Consumer>
        </ValidationProvider>
    )
}

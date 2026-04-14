/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  FormFieldGroupHeader,
  Icon,
  MenuToggle,
  MenuToggleElement,
  Split,
  SplitItem,
} from '@patternfly/react-core'
import { ArrowDownIcon, ArrowUpIcon, ExclamationCircleIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import get from 'get-value'
import {
  Fragment,
  ReactNode,
  RefObject,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  InputReviewMeta,
  ReviewPathPrefixSegmentsContext,
  ReviewPathPrefixSegmentsProvider,
  useStepInputsRegistry,
} from '../review/ReviewStepContexts'
import { WizTextDetail } from './WizTextDetail'
import { FieldGroup } from '../components/FieldGroup'
import { LabelHelp } from '../components/LabelHelp'
import { WizHelperText } from '../components/WizHelperText'
import { useData } from '../contexts/DataContext'
import { ItemContext } from '../contexts/ItemContext'
import { ShowValidationContext } from '../contexts/ShowValidationProvider'
import { useStringContext } from '../contexts/StringContext'
import { HasValidationErrorContext, ValidationProvider } from '../contexts/ValidationProvider'
import { buildReviewInputRegistrationPath, getCollapsedPlaceholder, InputCommonProps, useInput } from './Input'
import { useBumpReviewDomTree } from '../review/ReviewStepContexts'

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
  const { value, setValue, hidden, id, required } = useInput(props as InputCommonProps, { isArrayInput: true })
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

  const parentReviewPathSegments = useContext(ReviewPathPrefixSegmentsContext)
  const arrayChildReviewPathSegments = useMemo(() => {
    if (path == null || path === '') return parentReviewPathSegments
    const next = [...parentReviewPathSegments]
    if (item && typeof item === 'object' && 'kind' in item) {
      const kind = (item as { kind: unknown }).kind
      if (kind != null && String(kind) !== '') {
        next.push(String(kind))
      }
    }
    next.push(path)
    return next
  }, [parentReviewPathSegments, path, item])

  if (hidden) return <Fragment />

  return (
    <div id={id} className="form-wizard-array-input">
      {props.label && (
        <div style={{ paddingBottom: 8, paddingTop: 0 }}>
          {props.isSection ? (
            <Split hasGutter style={{ paddingBottom: 8 }}>
              <span className="pf-v6-c-form__section-title">{props.label}</span>
              {props.labelHelp && (
                <LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />
              )}
            </Split>
          ) : (
            <div>
              <span className="pf-v6-c-form__label pf-v6-c-form__label-text">{props.label}</span>
              {props.labelHelp && (
                <LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />
              )}
            </div>
          )}
          <WizHelperText {...props} />
        </div>
      )}
      <ReviewPathPrefixSegmentsProvider value={arrayChildReviewPathSegments}>
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
                required={required}
                moveUp={moveUp}
                moveDown={moveDown}
                removeItem={removeItem}
                defaultExpanded={!props.defaultCollapsed}
                hideFromReviewStep={props.hideFromReviewStep}
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
      </ReviewPathPrefixSegmentsProvider>
    </div>
  )
}

export function ArrayInputItem(props: {
  /** Parent `WizArrayInput` registration id; used for stable DOM ids in tests. */
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
  required?: boolean
  moveUp: (index: number) => void
  moveDown: (index: number) => void
  removeItem: (value: object) => void
  hideFromReviewStep?: boolean
}) {
  const {
    id: parentId,
    value,
    index,
    defaultExpanded,
    moveUp,
    moveDown,
    removeItem,
    count,
    required,
    hideFromReviewStep,
  } = props
  const [expanded, setExpanded] = useState(defaultExpanded !== undefined ? defaultExpanded : true)
  const reviewPathPrefixSegments = useContext(ReviewPathPrefixSegmentsContext)
  const registrationPath = buildReviewInputRegistrationPath(reviewPathPrefixSegments, String(index), value)
  const id =
    process.env.NODE_ENV === 'test' || (window as any).Cypress
      ? parentId + '-' + (index + 1).toString()
      : registrationPath

  const collapsedContentMeasureRef = useRef<HTMLDivElement>(null)

  const collapsedContent = useMemo(() => {
    return typeof props.collapsedContent === 'string' ? (
      <WizTextDetail
        id={props.collapsedContent}
        path={props.collapsedContent}
        placeholder={getCollapsedPlaceholder(props)}
      />
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
                <ArrayInputItemReviewRegistration
                  id={id}
                  index={index}
                  value={value}
                  collapsedContent={props.collapsedContent}
                  measureRef={collapsedContentMeasureRef}
                  hideFromReviewStep={hideFromReviewStep}
                >
                  <FieldGroup
                    id={id}
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
                                  <span className="pf-v6-c-form__helper-text pf-m-error">
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
                                  icon={<ArrowUpIcon />}
                                  variant="plain"
                                  aria-label={sortableMoveItemUpAriaLabel}
                                  isDisabled={index === 0}
                                  onClick={() => moveUp(index)}
                                />
                                <Button
                                  icon={<ArrowDownIcon />}
                                  variant="plain"
                                  aria-label={sortableMoveItemDownAriaLabel}
                                  isDisabled={index === count - 1}
                                  onClick={() => moveDown(index)}
                                />
                              </Fragment>
                            )}
                            {(!required || count > 1) && (
                              <Button
                                icon={<TrashIcon />}
                                variant="plain"
                                aria-label={removeItemAriaLabel}
                                onClick={() => removeItem(props.value)}
                              />
                            )}
                          </Fragment>
                        }
                      />
                    }
                  >
                    {expanded && typeof props.collapsedContent !== 'string' && (
                      <CollapsedContentMeasure ref={collapsedContentMeasureRef}>
                        {collapsedContent}
                      </CollapsedContentMeasure>
                    )}
                    <Split>
                      <SplitItem isFilled>
                        {expanded ? (
                          <Fragment>{expandedContent}</Fragment>
                        ) : typeof props.collapsedContent !== 'string' ? (
                          <div ref={collapsedContentMeasureRef} style={{ display: 'inline' }}>
                            {collapsedContent}
                          </div>
                        ) : (
                          <Fragment>{collapsedContent}</Fragment>
                        )}
                      </SplitItem>
                      <SplitItem>
                        {props.sortable && (
                          <Fragment>
                            <Button
                              icon={<ArrowUpIcon />}
                              variant="plain"
                              aria-label={sortableMoveItemUpAriaLabel}
                              isDisabled={index === 0}
                              onClick={() => moveUp(index)}
                            />
                            <Button
                              icon={<ArrowDownIcon />}
                              variant="plain"
                              aria-label={sortableMoveItemDownAriaLabel}
                              isDisabled={index === count - 1}
                              onClick={() => moveDown(index)}
                            />
                          </Fragment>
                        )}
                        {(!required || count > 1) && (
                          <Button
                            icon={<TrashIcon />}
                            variant="plain"
                            aria-label={removeItemAriaLabel}
                            onClick={() => removeItem(props.value)}
                            style={{ marginTop: -6 }}
                          />
                        )}
                      </SplitItem>
                    </Split>
                    {props.children}
                  </FieldGroup>
                </ArrayInputItemReviewRegistration>
              </ItemContext.Provider>
            )}
          </HasValidationErrorContext.Consumer>
        )}
      </ShowValidationContext.Consumer>
    </ValidationProvider>
  )
}

function ArrayInputItemReviewRegistration(props: {
  id: string
  index: number
  value: object
  collapsedContent: ReactNode | string
  measureRef: RefObject<HTMLDivElement | null>
  children: ReactNode
  hideFromReviewStep?: boolean
}) {
  const { id, index, value, collapsedContent, measureRef, children, hideFromReviewStep } = props
  const item = useContext(ItemContext)
  const stepInputsRegistry = useStepInputsRegistry()
  const bumpReviewDomTree = useBumpReviewDomTree()
  const parentReviewPathSegments = useContext(ReviewPathPrefixSegmentsContext)
  const instanceChildReviewPathSegments = useMemo(
    () => [...parentReviewPathSegments, String(index)],
    [parentReviewPathSegments, index]
  )
  useLayoutEffect(() => {
    if (!stepInputsRegistry || hideFromReviewStep) return
    const label = getArrayInstanceLabel(collapsedContent, item, measureRef.current)
    stepInputsRegistry.register(id, {
      id,
      path: id,
      value,
      label: label ?? '',
      type: InputReviewMeta.ARRAY_INSTANCE,
    })
    bumpReviewDomTree?.()
    return () => {
      stepInputsRegistry.unregister(id)
      bumpReviewDomTree?.()
    }
  }, [stepInputsRegistry, collapsedContent, measureRef, value, id, item, bumpReviewDomTree, hideFromReviewStep])

  return (
    <ReviewPathPrefixSegmentsProvider value={instanceChildReviewPathSegments}>
      {children}
    </ReviewPathPrefixSegmentsProvider>
  )
}

function getArrayInstanceLabel(
  collapsedContent: ReactNode | string,
  item: any,
  measureRoot: HTMLElement | null
): string | undefined {
  if (typeof collapsedContent === 'string') {
    return get(item, collapsedContent) ?? undefined
  }
  if (measureRoot) {
    const text = measureRoot.textContent
    if (text == null) return undefined
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  return undefined
}

const CollapsedContentMeasure = forwardRef<HTMLDivElement, { children: ReactNode }>(function CollapsedContentMeasure(
  { children },
  ref
) {
  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  )
})

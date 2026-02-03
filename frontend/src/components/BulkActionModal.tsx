/* Copyright Contributors to the Open Cluster Management project */

import { IRequestResult, ResourceError, ResourceErrorCode, resultsSettled } from '../resources/utils'
import {
  AcmAlert,
  AcmForm,
  AcmModal,
  AcmSubmit,
  AcmTable,
  AcmTableStateProvider,
  AcmTableProps,
  AcmTextInput,
} from '../ui-components'
import {
  ActionGroup,
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Progress,
  ProgressMeasureLocation,
  Stack,
  StackItem,
  Checkbox,
  AlertProps,
} from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from '../lib/acm-i18next'
import { getRawErrorInfo } from './ErrorPage'

export type BulkActionModalProps<T = undefined> = {
  action: string
  actionOneByOne?: boolean
  actionFn: (item: T, options?: { [key: string]: boolean }) => IRequestResult
  alert?: React.ReactNode
  close: () => void
  confirmText?: string
  description: string | React.ReactNode
  disableSubmitButton?: boolean
  hasExternalResources?: boolean
  hideTableAfterSubmit?: boolean
  icon?: AlertProps['variant']
  isDanger?: boolean
  isValidError?: (error: Error) => boolean
  onCancel?: () => void
  open: true
  processing: string
  title: string
  enableDeletePullSecret?: boolean
} & Required<Pick<AcmTableProps<T>, 'items'>> &
  Partial<Pick<AcmTableProps<T>, 'columns'>> & // Policy automation and cluster claim deletion modals omit columns prop to avoid showing a table
  Omit<AcmTableProps<T>, 'columns'>

export interface ItemError<T> {
  item: T
  error: Error
}

// Small post-processing delay to let UI (progress bar/toasts) settle before closing the modal.
// Tune if UX requires more/less time; keep minimal to avoid test flakiness.
const COMPLETE_DELAY_MS = 200
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function BulkActionModal<T = unknown>(props: BulkActionModalProps<T> | { open: false }) {
  const { t } = useTranslation()
  const [progress, setProgress] = useState(0)
  const [progressCount, setProgressCount] = useState(0)
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<ItemError<T>[] | undefined>()
  const [deletePullSecret, setDeletePullSecret] = useState(true)

  useEffect(() => {
    setConfirm('')
    setErrors(undefined)
    setProgress(0)
    setProgressCount(1)
    setDeletePullSecret(true)
  }, [props.open])

  if (props.open === false) {
    return <></>
  }

  const {
    actionOneByOne,
    action,
    actionFn,
    alert,
    close,
    columns,
    confirmText,
    description,
    disableSubmitButton,
    hasExternalResources,
    hideTableAfterSubmit,
    icon,
    isDanger,
    isValidError,
    onCancel,
    open,
    processing,
    title,
    enableDeletePullSecret,
    ...tableProps
  } = props

  function getItemError(item: T) {
    if (errors) {
      for (const error of errors) {
        if (error.item === item) {
          return getRawErrorInfo(error.error, t)
        }
      }
    }
    return undefined
  }

  const hasNoErrors = (errors?.length ?? 0) === 0

  const isErrorValid = (err: unknown) => (isValidError ? isValidError(err as Error) : true)

  function incrementProgress() {
    setProgress((p) => p + 1)
  }

  async function runSequential(items: T[], errors: ItemError<T>[]) {
    for (const item of items) {
      const { promise } = actionFn(item, { deletePullSecret })
      try {
        await promise
      } catch (err) {
        if (isErrorValid(err)) errors.push({ item, error: err as Error })
      }
      incrementProgress()
    }
  }

  async function runParallel(items: T[], errors: ItemError<T>[]) {
    const promises = items.map((resource) => {
      const r = actionFn(resource, { deletePullSecret })
      return { promise: r.promise.finally(incrementProgress), abort: r.abort }
    })
    const requestResult = resultsSettled(promises)
    const results = await requestResult.promise
    for (const [index, res] of results.entries()) {
      if (res.status === 'rejected' && isErrorValid(res.reason)) errors.push({ item: items[index], error: res.reason })
    }
  }

  return (
    <AcmModal
      variant={ModalVariant.large}
      title={title}
      titleIconVariant={icon}
      isOpen={true}
      onClose={close}
      position="top"
    >
      <AcmForm style={{ gap: 0 }}>
        <Stack hasGutter>
          {hasNoErrors ? (
            <Fragment>
              {description && <StackItem>{description}</StackItem>}
              {alert && <StackItem>{alert}</StackItem>}
              {columns && !(hideTableAfterSubmit && progress != 0) && (
                <StackItem>
                  <AcmTableStateProvider localStorageKey="model">
                    <AcmTable<T>
                      gridBreakPoint={TableGridBreakpoint.none}
                      tableActions={[]}
                      rowActions={[]}
                      perPageOptions={[]}
                      autoHidePagination
                      columns={columns}
                      {...tableProps}
                    />
                  </AcmTableStateProvider>
                </StackItem>
              )}

              <StackItem>
                {progress > 0 ? (
                  <Progress
                    value={(progress * 100) / progressCount}
                    measureLocation={progress ? ProgressMeasureLocation.outside : ProgressMeasureLocation.none}
                  />
                ) : (
                  <div style={{ minHeight: '24px' }} />
                )}
              </StackItem>

              {enableDeletePullSecret && (
                <StackItem>
                  <Checkbox
                    id="delete-pull-secret"
                    label={t('Delete pull-secret resource', { count: columns?.length })}
                    isChecked={deletePullSecret}
                    onChange={(_event, val) => setDeletePullSecret(val)}
                    isDisabled={progress > 0}
                  />
                </StackItem>
              )}
              {confirmText !== undefined && (
                <StackItem>
                  <AcmTextInput
                    label={t(`type.to.confirm`, { confirm: confirmText })}
                    id="confirm"
                    value={confirm}
                    onChange={(_event, val) => setConfirm(val)}
                    autoComplete="off"
                  />
                </StackItem>
              )}
            </Fragment>
          ) : (
            <Fragment>
              <StackItem>
                <AcmAlert
                  isInline
                  noClose
                  variant="danger"
                  title={t('there.were.errors')}
                  message={t('Expand the table rows to view detailed error messages.')}
                />
              </StackItem>
              {columns && (
                <StackItem>
                  <AcmTableStateProvider localStorageKey="model">
                    <AcmTable<T>
                      emptyState={undefined} // table only displayed when there are errors
                      items={tableProps.items.filter((item) => getItemError(item) !== undefined)}
                      columns={[
                        columns[0],
                        {
                          header: t('error'),
                          cell: (item) => {
                            const itemError = getItemError(item)
                            return (
                              <DescriptionList isHorizontal>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>{itemError?.title}</DescriptionListTerm>
                                  <DescriptionListDescription>{itemError?.message}</DescriptionListDescription>
                                </DescriptionListGroup>
                              </DescriptionList>
                            )
                          },
                        },
                      ]}
                      addSubRows={(item: T) => {
                        const itemError = getItemError(item)
                        return itemError?.details
                          ? [
                              {
                                noPadding: false,
                                cells: [
                                  {
                                    title: itemError.details,
                                  },
                                ],
                              },
                            ]
                          : []
                      }}
                      keyFn={tableProps.keyFn}
                      tableActions={[]}
                      rowActions={[]}
                      perPageOptions={[]}
                      autoHidePagination
                    />
                  </AcmTableStateProvider>
                </StackItem>
              )}
              <StackItem>
                <div style={{ minHeight: '24px' }} />
              </StackItem>
            </Fragment>
          )}
          {hasExternalResources && (
            <StackItem>
              <AcmAlert
                variant="info"
                title={t('Some selected resources are managed externally')}
                message={t('Any changes made here may be overridden by the content of an upstream repository.')}
                isInline
              />
            </StackItem>
          )}
        </Stack>
        <ActionGroup>
          {errors
            ? [
                <Button variant="primary" key="close-bulk-action" onClick={close}>
                  {t('Close')}
                </Button>,
              ]
            : [
                <AcmSubmit
                  key="submit-bulk-action"
                  id="submit-button"
                  isDisabled={
                    !tableProps.items?.length ||
                    (confirmText !== undefined && confirm !== confirmText) ||
                    disableSubmitButton
                  }
                  variant={isDanger ? ButtonVariant.danger : ButtonVariant.primary}
                  onClick={async () => {
                    const errors: ItemError<T>[] = []
                    setProgressCount(tableProps.items.length)
                    if (actionOneByOne) await runSequential(tableProps.items, errors)
                    else await runParallel(tableProps.items, errors)
                    await delay(COMPLETE_DELAY_MS)
                    setErrors(errors)
                    if (errors.length === 0) close()
                  }}
                  label={action}
                  processingLabel={processing}
                />,
                <Button variant="link" onClick={onCancel ?? close} key="cancel-bulk-action">
                  {t('cancel')}
                </Button>,
              ]}
        </ActionGroup>
      </AcmForm>
    </AcmModal>
  )
}

export function errorIsNot(codes: ResourceErrorCode[]) {
  return (error: Error) => error instanceof ResourceError && !codes.includes(error.code)
}

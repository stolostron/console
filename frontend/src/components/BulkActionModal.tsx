/* Copyright Contributors to the Open Cluster Management project */

import { IRequestResult, ResourceError, ResourceErrorCode, resultsSettled } from '../resources/utils'
import {
  AcmAlert,
  AcmForm,
  AcmModal,
  AcmSubmit,
  AcmTable,
  AcmTablePaginationContextProvider,
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
  ModalVariant,
  Progress,
  ProgressMeasureLocation,
  Stack,
  StackItem,
  Checkbox,
  AlertProps,
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from '../lib/acm-i18next'
import { getRawErrorInfo } from './ErrorPage'

export type BulkActionModalProps<T = undefined> = {
  action: string
  actionOneByOne?: boolean
  actionFn: (item: T, options?: { [key: string]: boolean }) => IRequestResult
  alert?: React.ReactNode
  checkBox?: JSX.Element
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
    checkBox,
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
        {hasNoErrors ? (
          <Fragment>
            {description}
            {checkBox}
            {alert}
            {columns && !(hideTableAfterSubmit && progress != 0) && (
              <AcmTablePaginationContextProvider localStorageKey="model">
                <AcmTable<T>
                  gridBreakPoint={TableGridBreakpoint.none}
                  tableActions={[]}
                  rowActions={[]}
                  perPageOptions={[]}
                  autoHidePagination
                  columns={columns}
                  {...tableProps}
                />
              </AcmTablePaginationContextProvider>
            )}

            <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
              {progress > 0 ? (
                <Progress
                  value={(progress * 100) / progressCount}
                  measureLocation={progress ? ProgressMeasureLocation.outside : ProgressMeasureLocation.none}
                />
              ) : (
                <div style={{ minHeight: '24px' }} />
              )}
            </div>
            <Stack hasGutter>
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
            </Stack>
          </Fragment>
        ) : (
          <Fragment>
            <AcmAlert
              isInline
              noClose
              variant="danger"
              title={t('there.were.errors')}
              message={t('Expand the table rows to view detailed error messages.')}
            />
            {columns && (
              <AcmTablePaginationContextProvider localStorageKey="model">
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
              </AcmTablePaginationContextProvider>
            )}
            <div style={{ minHeight: '24px' }} />
          </Fragment>
        )}
        {hasExternalResources && (
          <Stack>
            <StackItem>
              <AcmAlert
                variant="info"
                title={t('Some selected resources are managed externally')}
                message={t('Any changes made here may be overridden by the content of an upstream repository.')}
                isInline
              />
            </StackItem>
          </Stack>
        )}
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

                    const isErrorValid = (err: unknown) => (isValidError ? isValidError(err as Error) : true)

                    const runSequential = async (items: T[]) => {
                      for (const item of items) {
                        const { promise } = actionFn(item, { deletePullSecret })
                        try {
                          await promise
                        } catch (err) {
                          if (isErrorValid(err)) errors.push({ item, error: err as Error })
                        } finally {
                          setProgress((p) => p + 1)
                        }
                      }
                    }

                    const runParallel = async (items: T[]) => {
                      const requestResult = resultsSettled(
                        items.map((resource) => {
                          const r = actionFn(resource, { deletePullSecret })
                          return {
                            promise: r.promise.finally(() => setProgress((p) => p + 1)),
                            abort: r.abort,
                          }
                        })
                      )
                      const results = await requestResult.promise
                      for (const [index, res] of results.entries()) {
                        if (res.status === 'rejected' && isErrorValid(res.reason)) {
                          errors.push({ item: items[index], error: res.reason })
                        }
                      }
                    }

                    setProgressCount(tableProps.items.length)
                    if (actionOneByOne) {
                      await runSequential(tableProps.items)
                    } else {
                      await runParallel(tableProps.items)
                    }
                    await new Promise((resolve) => setTimeout(resolve, 500))
                    setErrors(errors)
                    if (errors.length === 0) {
                      close()
                    }
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

/* Copyright Contributors to the Open Cluster Management project */

import { IRequestResult, ResourceError, ResourceErrorCode, resultsSettled } from '../resources'
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
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from '../lib/acm-i18next'
import { getRawErrorInfo } from './ErrorPage'

export type BulkActionModalProps<T = undefined> = {
  action: string
  actionFn: (item: T) => IRequestResult
  checkBox?: JSX.Element
  close: () => void
  confirmText?: string
  description: string | React.ReactNode
  disableSubmitButton?: boolean
  hasExternalResources?: boolean
  hideTableAfterSubmit?: boolean
  icon?: 'success' | 'danger' | 'warning' | 'info' | 'default'
  isDanger?: boolean
  isValidError?: (error: Error) => boolean
  onCancel?: () => void
  open: true
  processing: string
  title: string
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

  useEffect(() => {
    setConfirm('')
    setErrors(undefined)
    setProgress(0)
    setProgressCount(1)
  }, [props.open])

  if (props.open === false) {
    return <></>
  }

  const {
    action,
    actionFn,
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

  return (
    <AcmModal
      variant={ModalVariant.medium}
      title={title}
      titleIconVariant={icon}
      isOpen={true}
      onClose={close}
      position="top"
    >
      <AcmForm style={{ gap: 0 }}>
        {!errors?.length ? (
          <Fragment>
            {description}
            {checkBox}
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
            {confirmText !== undefined && (
              <AcmTextInput
                label={t(`type.to.confirm`, { confirm: confirmText })}
                id="confirm"
                value={confirm}
                onChange={setConfirm}
                autoComplete="off"
              />
            )}
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
                    if (errors.length === 0) {
                      setProgressCount(tableProps.items.length)
                      const requestResult = resultsSettled(
                        tableProps.items.map((resource) => {
                          const r = actionFn(resource)
                          return {
                            promise: r.promise.finally(() => setProgress((progress) => progress + 1)),
                            abort: r.abort,
                          }
                        })
                      )
                      const promiseResults = await requestResult.promise
                      promiseResults.forEach((promiseResult, index) => {
                        if (promiseResult.status === 'rejected') {
                          let validError = true
                          if (isValidError) {
                            validError = isValidError(promiseResult.reason)
                          }
                          if (validError) {
                            errors.push({
                              item: tableProps.items[index],
                              error: promiseResult.reason,
                            })
                          }
                        }
                      })
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
                <Button variant="link" onClick={onCancel ? onCancel : close} key="cancel-bulk-action">
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

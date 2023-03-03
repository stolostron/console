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
  open: true
  action: string
  title: string
  processing: string
  close: () => void
  onCancel?: () => void
  description: string | React.ReactNode
  actionFn: (item: T) => IRequestResult
  checkBox?: JSX.Element
  confirmText?: string
  isDanger?: boolean
  isValidError?: (error: Error) => boolean
  hideTableAfterSubmit?: boolean
  icon?: 'success' | 'danger' | 'warning' | 'info' | 'default'
  hasExternalResources?: boolean
  disableSubmitButton?: boolean
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
      title={props.title}
      titleIconVariant={props.icon}
      isOpen={true}
      onClose={props.close}
      position="top"
    >
      <AcmForm style={{ gap: 0 }}>
        {!errors?.length ? (
          <Fragment>
            {props.description}
            {props.checkBox}
            {props.hideTableAfterSubmit && progress != 0
              ? undefined
              : props.columns &&
                props.keyFn && (
                  <AcmTablePaginationContextProvider localStorageKey="model">
                    <AcmTable<T>
                      gridBreakPoint={TableGridBreakpoint.none}
                      items={props.items}
                      columns={props.columns}
                      keyFn={props.keyFn}
                      tableActions={[]}
                      emptyState={props.emptyState}
                      rowActions={[]}
                      perPageOptions={[]}
                      autoHidePagination
                      showToolbar={props.showToolbar}
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
            {props.confirmText !== undefined && (
              <AcmTextInput
                label={t(`type.to.confirm`, { confirm: props.confirmText })}
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
            {props.columns && props.keyFn && (
              <AcmTablePaginationContextProvider localStorageKey="model">
                <AcmTable<T>
                  emptyState={undefined} // table only displayed when there are errors
                  items={props.items.filter((item) => getItemError(item) !== undefined)}
                  columns={[
                    props.columns[0],
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
                  keyFn={props.keyFn}
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
        {props.hasExternalResources && (
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
                <Button variant="primary" key="close-bulk-action" onClick={props.close}>
                  {t('Close')}
                </Button>,
              ]
            : [
                <AcmSubmit
                  key="submit-bulk-action"
                  id="submit-button"
                  isDisabled={
                    !props.items?.length ||
                    (props.confirmText !== undefined && confirm !== props.confirmText) ||
                    props.disableSubmitButton
                  }
                  variant={props.isDanger ? ButtonVariant.danger : ButtonVariant.primary}
                  onClick={async () => {
                    const errors: ItemError<T>[] = []
                    if (errors.length === 0) {
                      setProgressCount(props.items.length)
                      const requestResult = resultsSettled(
                        props.items.map((resource) => {
                          const r = props.actionFn(resource)
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
                          if (props.isValidError) {
                            validError = props.isValidError(promiseResult.reason)
                          }
                          if (validError) {
                            errors.push({
                              item: props.items[index],
                              error: promiseResult.reason,
                            })
                          }
                        }
                      })
                    }
                    await new Promise((resolve) => setTimeout(resolve, 500))
                    setErrors(errors)
                    if (errors.length === 0) {
                      props.close()
                    }
                  }}
                  label={props.action}
                  processingLabel={props.processing}
                />,
                <Button variant="link" onClick={props.onCancel ? props.onCancel : props.close} key="cancel-bulk-action">
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

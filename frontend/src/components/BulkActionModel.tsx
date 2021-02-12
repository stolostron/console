import {
    AcmAlert,
    AcmFormProvider,
    AcmModal,
    AcmSubmit,
    AcmTable,
    AcmTablePaginationContextProvider,
    AcmTextInput,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    Button,
    ButtonVariant,
    Form,
    ModalVariant,
    Progress,
    ProgressMeasureLocation,
} from '@patternfly/react-core'
import React, { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getErrorInfo } from '../components/ErrorPage'
import { IRequestResult, ResourceError, ResourceErrorCode, resultsSettled } from '../lib/resource-request'

export interface IBulkActionModelProps<T = undefined> {
    open: true
    plural: string
    singular: string
    action: string
    processing: string
    resources: Array<T>
    close: () => void
    description: string
    columns?: IAcmTableColumn<T>[]
    keyFn?: (item: T) => string
    actionFn: (item: T) => IRequestResult
    confirmText?: string
    isDanger?: boolean
    isValidError?: (error: Error) => boolean
}

interface ItemError<T> {
    item: T
    error: Error
}

export function BulkActionModel<T = unknown>(props: IBulkActionModelProps<T> | { open: false }) {
    const { t } = useTranslation(['common'])
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
                    return getErrorInfo(error.error)
                }
            }
        }
        return undefined
    }

    return (
        <AcmFormProvider>
            <AcmModal
                variant={ModalVariant.medium}
                title={`${props.action} ${
                    props.resources.length === 1 ? props.singular.toLowerCase() : props.plural.toLowerCase()
                }`}
                isOpen={true}
                onClose={props.close}
            >
                <Form style={{ gap: 0 }}>
                    {!errors ? (
                        <Fragment>
                            {props.description}
                            {props.columns && props.keyFn && (
                                <AcmTablePaginationContextProvider localStorageKey="model">
                                    <AcmTable<T>
                                        plural={props.plural}
                                        items={props.resources}
                                        columns={props.columns}
                                        keyFn={props.keyFn}
                                        tableActions={[]}
                                        rowActions={[]}
                                        bulkActions={[]}
                                        perPageOptions={[]}
                                        autoHidePagination
                                    />
                                </AcmTablePaginationContextProvider>
                            )}

                            <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                                {progress > 0 ? (
                                    <Progress
                                        value={(progress * 100) / progressCount}
                                        measureLocation={
                                            progress ? ProgressMeasureLocation.outside : ProgressMeasureLocation.none
                                        }
                                    />
                                ) : (
                                    <div style={{ minHeight: '24px' }} />
                                )}
                            </div>
                            {props.confirmText !== undefined && (
                                <AcmTextInput
                                    label={t(`type.to.confirm`).replace('{0}', props.confirmText)}
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
                                title={
                                    errors.length === 1
                                        ? `${t('common:there.was.an.error')
                                              .replace('{0}', props.processing.toLowerCase())
                                              .replace('{1}', props.singular.toLowerCase())}`
                                        : `${t('common:there.were.errors')
                                              .replace('{0}', props.processing.toLowerCase())
                                              .replace('{1}', props.plural.toLowerCase())}`
                                }
                            />
                            {props.columns && props.keyFn && (
                                <AcmTablePaginationContextProvider localStorageKey="model">
                                    <AcmTable<T>
                                        plural=""
                                        items={props.resources.filter((item) => getItemError(item) !== undefined)}
                                        columns={[
                                            props.columns[0],
                                            {
                                                header: t('common:error'),
                                                cell: (item) => {
                                                    return <Fragment>{getItemError(item)?.message}</Fragment>
                                                },
                                            },
                                        ]}
                                        keyFn={props.keyFn}
                                        tableActions={[]}
                                        rowActions={[]}
                                        bulkActions={[]}
                                        perPageOptions={[]}
                                        autoHidePagination
                                    />
                                </AcmTablePaginationContextProvider>
                            )}
                            <div style={{ minHeight: '24px' }} />
                        </Fragment>
                    )}
                    <ActionGroup>
                        {errors
                            ? [
                                  <Button variant="primary" key="close-bulk-action" onClick={props.close}>
                                      {t('common:close')}
                                  </Button>,
                              ]
                            : [
                                  <AcmSubmit
                                      key="submit-bulk-action"
                                      id="submit-button"
                                      isDisabled={props.confirmText !== undefined && confirm !== props.confirmText}
                                      variant={props.isDanger ? ButtonVariant.danger : ButtonVariant.primary}
                                      onClick={async () => {
                                          setProgressCount(props.resources.length)
                                          const requestResult = resultsSettled(
                                              props.resources.map((resource) => {
                                                  const r = props.actionFn(resource)
                                                  return {
                                                      promise: r.promise.finally(() =>
                                                          setProgress((progress) => progress + 1)
                                                      ),
                                                      abort: r.abort,
                                                  }
                                              })
                                          )
                                          const promiseResults = await requestResult.promise
                                          const errors: ItemError<T>[] = []
                                          promiseResults.forEach((promiseResult, index) => {
                                              if (promiseResult.status === 'rejected') {
                                                  let validError = true
                                                  if (props.isValidError) {
                                                      validError = props.isValidError(promiseResult.reason)
                                                  }
                                                  if (validError) {
                                                      errors.push({
                                                          item: props.resources[index],
                                                          error: promiseResult.reason,
                                                      })
                                                  }
                                              }
                                          })
                                          await new Promise((resolve) => setTimeout(resolve, 500))
                                          setErrors(errors)
                                          if (errors.length === 0) {
                                              props.close()
                                          }
                                      }}
                                      label={props.action}
                                      processingLabel={props.processing}
                                  />,
                                  <Button variant="link" onClick={props.close} key="cancel-bulk-action">
                                      {t('common:cancel')}
                                  </Button>,
                              ]}
                    </ActionGroup>
                </Form>
            </AcmModal>
        </AcmFormProvider>
    )
}

export function errorIsNot(codes: ResourceErrorCode[]) {
    return (error: Error) => error instanceof ResourceError && !codes.includes(error.code)
}

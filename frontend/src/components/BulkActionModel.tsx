import {
    AcmAlertContext,
    AcmAlertProvider,
    AcmFormProvider,
    AcmModal,
    AcmSubmit,
    AcmTable,
    AcmTablePaginationContextProvider,
    AcmTextInput,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Button, ButtonVariant, Form, ModalVariant, Progress, ProgressMeasureLocation } from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getErrorInfo } from '../components/ErrorPage'
import { IRequestResult, resultsSettled } from '../lib/resource-request'

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
}

interface ItemError<T> {
    item: T
    error: Error
}

export function BulkActionModel<T = unknown>(props: IBulkActionModelProps<T> | { open: false }) {
    const { t } = useTranslation(['common'])
    const alertContext = useContext(AcmAlertContext)
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
                title={
                    errors
                        ? `${props.action} ${t('errors')}`
                        : `${props.action} ${
                              props.resources.length === 1 ? props.singular.toLowerCase() : props.plural.toLowerCase()
                          }`
                }
                isOpen={true}
                onClose={props.close}
                actions={
                    errors
                        ? [
                              <Button variant="primary" onClick={props.close}>
                                  {t('common:close')}
                              </Button>,
                          ]
                        : [
                              <AcmSubmit
                                  id="submit-button"
                                  isDisabled={
                                      props.confirmText !== undefined &&
                                      confirm.toUpperCase() !== props.confirmText.toUpperCase()
                                  }
                                  variant={props.isDanger ? ButtonVariant.danger : ButtonVariant.primary}
                                  onClick={async () => {
                                      alertContext.clearAlerts()
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
                                              errors.push({
                                                  item: props.resources[index],
                                                  error: promiseResult.reason,
                                              })
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
                              <Button variant="link" onClick={props.close}>
                                  {t('common:cancel')}
                              </Button>,
                          ]
                }
            >
                <AcmAlertProvider>
                    <Form style={{ gap: 0 }}>
                        {!errors ? (
                            <Fragment>
                                {props.description}
                                {props.columns && props.keyFn && (
                                    <AcmTablePaginationContextProvider localStorageKey="model">
                                        <AcmTable<T>
                                            plural=""
                                            items={props.resources}
                                            columns={props.columns}
                                            keyFn={props.keyFn}
                                            tableActions={[]}
                                            rowActions={[]}
                                            bulkActions={[]}
                                            perPageOptions={[]}
                                        />
                                    </AcmTablePaginationContextProvider>
                                )}
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
                            </Fragment>
                        ) : (
                            <Fragment>
                                {errors.length === 1
                                    ? `${t('common:there.was.an.error')
                                          .replace('{0}', props.processing.toLowerCase())
                                          .replace('{1}', props.singular.toLowerCase())}`
                                    : `${t('common:there.were.errors')
                                          .replace('{0}', props.processing.toLowerCase())
                                          .replace('{1}', props.plural.toLowerCase())}`}
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
                                                        return (
                                                            <Fragment>
                                                                <ExclamationCircleIcon style={{ color: 'red' }} />{' '}
                                                                &nbsp;
                                                                {getItemError(item)?.message}
                                                            </Fragment>
                                                        )
                                                    },
                                                },
                                            ]}
                                            keyFn={props.keyFn}
                                            tableActions={[]}
                                            rowActions={[]}
                                            bulkActions={[]}
                                            perPageOptions={[]}
                                        />
                                    </AcmTablePaginationContextProvider>
                                )}
                            </Fragment>
                        )}
                        {props.confirmText !== undefined && (
                            <AcmTextInput
                                label={t(`type.to.confirm`).replace('{0}', props.confirmText)}
                                id="confirm"
                                value={confirm}
                                onChange={setConfirm}
                                autoComplete="off"
                            />
                        )}
                    </Form>
                </AcmAlertProvider>
            </AcmModal>
        </AcmFormProvider>
    )
}

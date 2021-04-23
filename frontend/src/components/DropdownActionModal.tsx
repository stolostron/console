/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlert,
    AcmForm,
    AcmFormProvider,
    AcmModal,
    AcmSelect,
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
    ModalVariant,
    Progress,
    ProgressMeasureLocation,
    SelectOption,
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { prependListener } from 'node:process'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getErrorInfo } from '../components/ErrorPage'
import { IRequestResult, ResourceError, ResourceErrorCode, resultsSettled } from '../lib/resource-request'

export interface IDropdownActionModelProps {
    open: true
    action: string
    title: string
    processing: string
    selectOptions: Array<string>
    //resources: Array<T>
    close: () => void
    onCancel?: () => void
    description: string | React.ReactNode
    actionFn?: (item: string) => IRequestResult
    //preActionFn?: (items: Array<T>, errors: ItemError<T>[]) => void
    isDanger?: boolean
    isValidError?: (error: Error) => boolean
    emptyState?: JSX.Element
    selectLabel: string
    selectPlaceholder: string
    confirmText: string
}

interface ItemError<T> {
    item: T
    error: Error
}

export function DropdownActionModel<T = unknown>(props: IDropdownActionModelProps | { open: false }) {
    const { t } = useTranslation(['common'])
    const [progress, setProgress] = useState(0)
    const [progressCount, setProgressCount] = useState(0)
    const [confirm, setConfirm] = useState('')
    const [errors, setErrors] = useState<ItemError<T>[] | undefined>()
    const [selection, setSelection] = useState<string | undefined>()

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
            <AcmModal variant={ModalVariant.medium} title={props.title} isOpen={true} onClose={props.close}>
                <AcmForm style={{ gap: 0 }}>
                    {!errors ? (
                        <Fragment>
                            {props.description}
                            <AcmSelect
                                id="modal-selector"
                                toggleId="modal-selector-toggal"
                                label={props.selectLabel}
                                placeholder={props.selectPlaceholder}
                                value={selection}
                                onChange={(selection) => {
                                    setSelection(selection)
                                }}
                                isRequired
                            >
                                {props.selectOptions.map((option) => (
                                    <SelectOption key={option} value={option}>
                                        {option}
                                    </SelectOption>
                                ))}
                            </AcmSelect>
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
                        </Fragment>
                    ) : (
                        <Fragment>
                            <AcmAlert isInline noClose variant="danger" title={t('common:there.were.errors')} />
                            <div style={{ minHeight: '24px' }} />
                        </Fragment>
                    )}
                    <ActionGroup>
                        {errors
                            ? [
                                  <Button variant="primary" key="close-action" onClick={props.close}>
                                      {t('common:close')}
                                  </Button>,
                              ]
                            : [
                                  <AcmSubmit
                                      key="submit-action"
                                      id="submit-button"
                                      isDisabled={
                                          !props.selectOptions?.length ||
                                          (props.confirmText !== undefined && confirm !== props.confirmText)
                                      }
                                      variant={props.isDanger ? ButtonVariant.danger : ButtonVariant.primary}
                                      onClick={async () => {
                                          const errors: ItemError<T>[] = []
                                          //   if (props.preActionFn) {
                                          //       props.preActionFn(props.resources, errors)
                                          //   }
                                          //   if (errors.length === 0) {
                                          //       setProgressCount(props.resources.length)
                                          //       const requestResult = resultsSettled(
                                          //           props.resources.map((resource) => {
                                          //               const r = props.actionFn(resource)
                                          //               return {
                                          //                   promise: r.promise.finally(() =>
                                          //                       setProgress((progress) => progress + 1)
                                          //                   ),
                                          //                   abort: r.abort,
                                          //               }
                                          //           })
                                          //       )
                                          //   const promiseResults = await requestResult.promise
                                          //   promiseResults.forEach((promiseResult, index) => {
                                          //       if (promiseResult.status === 'rejected') {
                                          //           let validError = true
                                          //           if (props.isValidError) {
                                          //               validError = props.isValidError(promiseResult.reason)
                                          //           }
                                          //           if (validError) {
                                          //               errors.push({
                                          //                   item: props.resources[index],
                                          //                   error: promiseResult.reason,
                                          //               })
                                          //           }
                                          //       }
                                          //   })
                                          // }
                                          //   await new Promise((resolve) => setTimeout(resolve, 500))
                                          //   setErrors(errors)
                                          //   if (errors.length === 0) {
                                          //       props.close()
                                          //   }
                                      }}
                                      label={props.action}
                                      processingLabel={props.processing}
                                  />,
                                  <Button
                                      variant="link"
                                      onClick={props.onCancel ? props.onCancel : props.close}
                                      key="cancel-bulk-action"
                                  >
                                      {t('common:cancel')}
                                  </Button>,
                              ]}
                    </ActionGroup>
                </AcmForm>
            </AcmModal>
        </AcmFormProvider>
    )
}

export function errorIsNot(codes: ResourceErrorCode[]) {
    return (error: Error) => error instanceof ResourceError && !codes.includes(error.code)
}

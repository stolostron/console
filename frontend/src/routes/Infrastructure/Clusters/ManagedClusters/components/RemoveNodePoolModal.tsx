/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, Button, ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { Fragment, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { deleteResource, IRequestResult, NodePool, ResourceError, resultsSettled } from '../../../../../resources'
import { AcmAlert, AcmModal, AcmSubmit, AcmTable } from '../../../../../ui-components'

export interface IRemoveNodePoolModalProps {
    close: () => void
    open: true
    nodepool: NodePool
    nodepoolCount: number
}

export function RemoveNodePoolModal(props: IRemoveNodePoolModalProps | { open: false }) {
    const { t } = useTranslation()
    const [resourceErrors, setResourceErrors] = useState<any[]>([])

    if (props.open === false) {
        return <></>
    }

    const deleteNodepool = () => {
        const deleteResult = deleteResource(props.nodepool)

        return {
            promise: new Promise((resolve, reject) => {
                deleteResult.promise
                    .then((data) => {
                        return resolve(data)
                    })
                    .catch((err: ResourceError) => {
                        reject(err)
                    })
            }),
            abort: () => {
                deleteResult.abort()
            },
        }
    }

    return (
        <AcmModal
            titleIconVariant="warning"
            variant={ModalVariant.medium}
            title={t('Permanently remove node pool {{name}}?', { name: props.nodepool.metadata.name })}
            isOpen={true}
            onClose={props.close}
        >
            {resourceErrors.length === 0 ? (
                <Fragment>
                    {props.nodepoolCount - 1 === 0 && (
                        <div style={{ paddingTop: '10px', paddingBottom: '10px' }}>
                            <AcmAlert
                                isInline
                                noClose
                                variant="info"
                                title={t('Removing last node pool')}
                                message={t(
                                    'Platform specific data for the add node pool form will no longer automatically populate after the last node pool is removed.'
                                )}
                            />
                        </div>
                    )}
                    <ActionGroup>
                        <AcmSubmit
                            key="submit-remove-nodepool-action"
                            id="submit-remove-nodepool-action"
                            isDisabled={false}
                            variant={ButtonVariant.danger}
                            onClick={async () => {
                                const errors: any[] = []
                                const resultArr: IRequestResult[] = []

                                resultArr.push(deleteNodepool())

                                const requestResult = resultsSettled(resultArr)
                                const promiseResults = await requestResult.promise
                                promiseResults.forEach((promiseResult) => {
                                    if (promiseResult.status === 'rejected') {
                                        errors.push({
                                            msg: promiseResult.reason,
                                        })
                                    }
                                })

                                await new Promise((resolve) => setTimeout(resolve, 500))
                                setResourceErrors(errors)
                                if (errors.length === 0) {
                                    props.close()
                                }
                            }}
                            label={t('remove')}
                            processingLabel={t('Processing')}
                        />
                        <Button variant="link" onClick={props.close} key="cancel-hypershift-upgrade">
                            {t('cancel')}
                        </Button>
                    </ActionGroup>
                </Fragment>
            ) : (
                <Fragment>
                    <AcmAlert isInline noClose variant="danger" title={t('there.were.errors')} />
                    <AcmTable
                        plural=""
                        items={resourceErrors}
                        columns={[
                            {
                                header: t('Error'),
                                cell: (error) => {
                                    return error.msg
                                },
                            },
                        ]}
                        keyFn={(error) => error.name as string}
                        tableActions={[]}
                        rowActions={[]}
                        perPageOptions={[]}
                        autoHidePagination
                    />
                    <Button variant="link" onClick={props.close} key="hypershift-remove-nodepool-close">
                        {t('close')}
                    </Button>
                </Fragment>
            )}
        </AcmModal>
    )
}

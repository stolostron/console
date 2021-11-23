/* Copyright Contributors to the Open Cluster Management project */

import { IResource, patchResource } from '../../../../../resources'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmForm,
    AcmLabelsInput,
    AcmModal,
    AcmSubmit,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, ModalVariant } from '@patternfly/react-core'
import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getErrorInfo } from '../../../../../components/ErrorPage'

export function EditLabels(props: { resource?: IResource; displayName?: string; close: () => void }) {
    const { t } = useTranslation()
    const [labels, setLabels] = useState<Record<string, string>>({})

    useLayoutEffect(() => {
        /* istanbul ignore next */
        const labels = props.resource?.metadata?.labels ?? {}
        setLabels({ ...labels })
    }, [props.resource?.metadata?.labels])

    return (
        <AcmModal
            title={t('Edit labels')}
            isOpen={props.resource !== undefined}
            variant={ModalVariant.medium}
            onClose={props.close}
        >
            <AcmAlertContext.Consumer>
                {(alertContext) => (
                    <AcmForm style={{ gap: 0 }}>
                        <div>
                            {t(
                                'Labels help you organize and select resources. Adding labels allows you to query for objects by using the labels. Selecting labels during policy and application creation allows you to distribute your resources to different clusters that share common labels.'
                            )}
                        </div>
                        &nbsp;
                        <AcmLabelsInput
                            id="labels-input"
                            // TODO - Handle interpolation
                            label={t('{{resourceName}} labels', {
                                resourceName: props.displayName ?? props.resource?.metadata?.name,
                            })}
                            buttonLabel={t('Add label')}
                            value={labels}
                            onChange={(labels) => setLabels(labels!)}
                            placeholder={t('Enter key=value, then press enter, space, or comma')}
                        />
                        <AcmAlertGroup isInline canClose />
                        <ActionGroup>
                            <AcmSubmit
                                id="add-labels"
                                variant="primary"
                                onClick={() => {
                                    alertContext.clearAlerts()
                                    const resource: IResource = {
                                        apiVersion: props.resource!.apiVersion,
                                        kind: props.resource!.kind,
                                        metadata: {
                                            name: props.resource!.metadata!.name,
                                            labels: props.resource!.metadata!.labels,
                                        },
                                    }
                                    let patch: { op: string; path: string; value?: unknown }[] = []

                                    /* istanbul ignore else */
                                    if (resource!.metadata!.labels) {
                                        patch = [
                                            ...patch,
                                            ...Object.keys(resource!.metadata!.labels).map((key) => {
                                                key = key.replace(/\//g, '~1')
                                                return {
                                                    op: 'remove',
                                                    path: `/metadata/labels/${key}`,
                                                }
                                            }),
                                        ]
                                    }
                                    patch = [
                                        ...patch,
                                        ...Object.keys(labels).map((key) => {
                                            const keyPath = key.replace(/\//g, '~1')
                                            return {
                                                op: 'add',
                                                path: `/metadata/labels/${keyPath}`,
                                                value: labels[key],
                                            }
                                        }),
                                    ]

                                    if (resource!.metadata?.labels === undefined) {
                                        patch.unshift({
                                            op: 'add',
                                            path: '/metadata/labels',
                                            value: {},
                                        })
                                    }

                                    return patchResource(resource!, patch)
                                        .promise.then(() => {
                                            props.close()
                                        })
                                        .catch((err) => {
                                            const errorInfo = getErrorInfo(err)
                                            alertContext.addAlert({
                                                type: 'danger',
                                                title: errorInfo.title,
                                                message: errorInfo.message,
                                            })
                                        })
                                }}
                                label={t('Save')}
                                processingLabel={t('Saving')}
                            />
                            <Button variant="link" onClick={props.close}>
                                {t('Cancel')}
                            </Button>
                        </ActionGroup>
                    </AcmForm>
                )}
            </AcmAlertContext.Consumer>
        </AcmModal>
    )
}

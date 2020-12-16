import {
    AcmAlertGroup,
    AcmAlertProvider,
    AcmForm,
    AcmLabelsInput,
    AcmModal,
    AcmSubmit,
    AcmAlertContext,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, ModalVariant } from '@patternfly/react-core'
import React, { useContext, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getErrorInfo } from '../../../../components/ErrorPage'
import { Cluster } from '../../../../lib/get-cluster'
import { patchResource } from '../../../../lib/resource-request'
import { ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import { IResource } from '../../../../resources/resource'

export function EditLabelsModal(props: { cluster?: Cluster; close: () => void }) {
    const { t } = useTranslation(['cluster', 'common'])
    const alertContext = useContext(AcmAlertContext)
    const [labels, setLabels] = useState<Record<string, string>>({})
    useLayoutEffect(() => {
        /* istanbul ignore next */
        const labels = props.cluster?.labels ?? {}
        setLabels({ ...labels })
    }, [props.cluster?.labels])

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={t('labels.edit.title')}
            isOpen={props.cluster !== undefined}
            onClose={props.close}
        >
            <AcmAlertProvider>
                <AcmForm style={{ gap: 0 }}>
                    <div>{t('labels.description')}</div>
                    &nbsp;
                    <AcmLabelsInput
                        id="labels-input"
                        label={`${props.cluster?.name} ${t('labels.lower')}`}
                        buttonLabel={t('labels.button.add')}
                        value={labels}
                        onChange={(labels) => setLabels(labels!)}
                    />
                    <AcmAlertGroup isInline canClose />
                    <ActionGroup>
                        <AcmSubmit
                            id="add-labels"
                            variant="primary"
                            onClick={() => {
                                alertContext.clearAlerts()
                                const resource: IResource = {
                                    apiVersion: ManagedClusterApiVersion,
                                    kind: ManagedClusterKind,
                                    metadata: {
                                        name: props.cluster?.name,
                                        labels: props.cluster?.labels,
                                    },
                                }
                                let patch: { op: string; path: string; value?: unknown }[] = []
                                /* istanbul ignore else */
                                if (resource!.metadata.labels) {
                                    patch = [
                                        ...patch,
                                        ...Object.keys(resource!.metadata.labels).map((key) => ({
                                            op: 'remove',
                                            path: `/metadata/labels/${key}`,
                                        })),
                                    ]
                                }
                                patch = [
                                    ...patch,
                                    ...Object.keys(labels).map((key) => ({
                                        op: 'add',
                                        path: `/metadata/labels/${key}`,
                                        value: labels[key],
                                    })),
                                ]
                                return patchResource(resource!, patch)
                                    .promise.then(() => {
                                        props.close()
                                    })
                                    .catch((err) => {
                                        const errorInfo = getErrorInfo(err)
                                        alertContext.addAlert({
                                            type: 'danger',
                                            title: errorInfo.message,
                                            message: errorInfo.message,
                                        })
                                    })
                            }}
                            label={t('common:save')}
                            processingLabel={t('common:saving')}
                        />
                        <Button variant="link" onClick={props.close}>
                            {t('common:cancel')}
                        </Button>
                    </ActionGroup>
                </AcmForm>
            </AcmAlertProvider>
        </AcmModal>
    )
}

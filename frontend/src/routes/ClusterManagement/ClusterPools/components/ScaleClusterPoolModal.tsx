/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
    AcmForm,
    AcmSubmit,
    AcmButton,
    AcmModal,
    AcmAlertGroup,
    AcmAlertContext,
    AcmNumberInput,
} from '@open-cluster-management/ui-components'
import { ModalVariant, ActionGroup } from '@patternfly/react-core'
import { ClusterPool } from '../../../../resources/cluster-pool'
import { patchResource } from '../../../../lib/resource-request'

export type ScaleClusterPoolModalProps = {
    clusterPool?: ClusterPool
    onClose?: () => void
}

export function ScaleClusterPoolModal(props: ScaleClusterPoolModalProps) {
    const { t } = useTranslation(['cluster', 'common'])
    const [size, setSize] = useState<number>(0)

    useEffect(() => {
        if (props.clusterPool) {
            setSize(props.clusterPool.spec?.size!)
        } else if (!props.clusterPool) {
            setSize(0)
        }
    }, [props.clusterPool])

    function reset() {
        props.onClose?.()
        setSize(0)
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={t('clusterPool.modal.scale.title')}
            isOpen={!!props.clusterPool}
            onClose={reset}
        >
            <AcmForm>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <div>
                                <Trans
                                    i18nKey="cluster:clusterPool.modal.scale.message"
                                    values={{ clusterPoolName: props.clusterPool?.metadata.name }}
                                    components={{ bold: <strong /> }}
                                />
                            </div>
                            <AcmNumberInput
                                label={t('clusterPool.modal.scale.input')}
                                id="scale"
                                min={0}
                                value={size}
                                onChange={(event) => setSize(Number((event.target as HTMLInputElement).value))}
                                onMinus={() => setSize(size - 1)}
                                onPlus={() => setSize(size + 1)}
                                validation={(size: Number) => {
                                    if (size < 0) return t('clusterPool.modal.scale.validation.greaterThanZero')
                                    return undefined
                                }}
                                required
                            />
                            <AcmAlertGroup isInline canClose padTop />
                            <ActionGroup>
                                <AcmSubmit
                                    id="claim"
                                    variant="primary"
                                    label={t('common:scale')}
                                    processingLabel={t('common:scaling')}
                                    onClick={() => {
                                        alertContext.clearAlerts()
                                        return patchResource(props.clusterPool!, [
                                            {
                                                op: 'replace',
                                                path: '/spec/size',
                                                value: size,
                                            },
                                        ])
                                            .promise.then(() => reset())
                                            .catch((e) => {
                                                if (e instanceof Error) {
                                                    alertContext.addAlert({
                                                        type: 'danger',
                                                        title: t('common:request.failed'),
                                                        message: e.message,
                                                    })
                                                }
                                            })
                                    }}
                                />
                                <AcmButton key="cancel" variant="link" onClick={reset}>
                                    {t('common:cancel')}
                                </AcmButton>
                            </ActionGroup>
                        </>
                    )}
                </AcmAlertContext.Consumer>
            </AcmForm>
        </AcmModal>
    )
}

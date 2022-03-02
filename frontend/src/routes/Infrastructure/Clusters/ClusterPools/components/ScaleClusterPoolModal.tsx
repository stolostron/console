/* Copyright Contributors to the Open Cluster Management project */

import { ClusterPool, patchResource } from '../../../../../resources'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmForm,
    AcmModal,
    AcmNumberInput,
    AcmSubmit,
} from '@stolostron/ui-components'
import { ActionGroup, ModalVariant } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'

export type ScaleClusterPoolModalProps = {
    clusterPool?: ClusterPool
    onClose?: () => void
}

export function ScaleClusterPoolModal(props: ScaleClusterPoolModalProps) {
    const { t } = useTranslation()
    const [size, setSize] = useState<number>(0)
    const [runningCount, setRunningCount] = useState<number>(0)

    useEffect(() => {
        if (props.clusterPool) {
            setSize(props.clusterPool.spec?.size!)
        } else if (!props.clusterPool) {
            setSize(0)
        }
    }, [props.clusterPool])

    useEffect(() => {
        if (props.clusterPool && !!props.clusterPool.spec?.runningCount) {
            setRunningCount(props.clusterPool.spec?.runningCount!)
        } else if (!props.clusterPool) {
            setRunningCount(0)
        }
    }, [props.clusterPool])

    function reset() {
        props.onClose?.()
        setSize(0)
        setRunningCount(0)
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
                                    i18nKey="clusterPool.modal.scale.message"
                                    values={{ clusterPoolName: props.clusterPool?.metadata.name }}
                                    components={{ bold: <strong /> }}
                                />
                            </div>
                            <AcmNumberInput
                                label={t('clusterPool.modal.scale.size.input')}
                                id="scale-size"
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
                            <AcmNumberInput
                                label={t('clusterPool.modal.scale.runningCount.input')}
                                id="scale-runningCount"
                                min={0}
                                value={runningCount}
                                onChange={(event) => setRunningCount(Number((event.target as HTMLInputElement).value))}
                                onMinus={() => setRunningCount(runningCount - 1)}
                                onPlus={() => setRunningCount(runningCount + 1)}
                                validation={(runningCount: Number) => {
                                    if (runningCount < 0) return t('clusterPool.modal.scale.validation.greaterThanZero')
                                    return undefined
                                }}
                                required
                            />
                            <AcmAlertGroup isInline canClose />
                            <ActionGroup>
                                <AcmSubmit
                                    id="claim"
                                    variant="primary"
                                    label={t('scale')}
                                    processingLabel={t('scaling')}
                                    onClick={() => {
                                        alertContext.clearAlerts()
                                        return patchResource(props.clusterPool!, [
                                            {
                                                op: 'replace',
                                                path: '/spec/size',
                                                value: size,
                                            },
                                            {
                                                op: 'replace',
                                                path: '/spec/runningCount',
                                                value: runningCount,
                                            },
                                        ])
                                            .promise.then(() => reset())
                                            .catch((e) => {
                                                if (e instanceof Error) {
                                                    alertContext.addAlert({
                                                        type: 'danger',
                                                        title: t('request.failed'),
                                                        message: e.message,
                                                    })
                                                }
                                            })
                                    }}
                                />
                                <AcmButton key="cancel" variant="link" onClick={reset}>
                                    {t('cancel')}
                                </AcmButton>
                            </ActionGroup>
                        </>
                    )}
                </AcmAlertContext.Consumer>
            </AcmForm>
        </AcmModal>
    )
}

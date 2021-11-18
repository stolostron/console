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
} from '@open-cluster-management/ui-components'
import { ActionGroup, ModalVariant } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

export type ScaleClusterPoolModalProps = {
    clusterPool?: ClusterPool
    onClose?: () => void
}

export function ScaleClusterPoolModal(props: ScaleClusterPoolModalProps) {
    const { t } = useTranslation()
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
            title={t('Scale cluster pool')}
            isOpen={!!props.clusterPool}
            onClose={reset}
        >
            <AcmForm>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <div>
                                <Trans
                                    // TODO - Handle interpolation
                                    i18nKey="Specify the desired size of <bold>{{clusterPoolName}}</bold>. Adjusting the size of the cluster pool will result in the creation or destruction of clusters; only unclaimed clusters will be destroyed if downsizing."
                                    values={{ clusterPoolName: props.clusterPool?.metadata.name }}
                                    components={{ bold: <strong /> }}
                                />
                            </div>
                            <AcmNumberInput
                                label={t('Set desired cluster pool size')}
                                id="scale"
                                min={0}
                                value={size}
                                onChange={(event) => setSize(Number((event.target as HTMLInputElement).value))}
                                onMinus={() => setSize(size - 1)}
                                onPlus={() => setSize(size + 1)}
                                validation={(size: Number) => {
                                    // TODO - definition never existed
                                    if (size < 0) return t('clusterPool.modal.scale.validation.greaterThanZero')
                                    return undefined
                                }}
                                required
                            />
                            <AcmAlertGroup isInline canClose />
                            <ActionGroup>
                                <AcmSubmit
                                    id="claim"
                                    variant="primary"
                                    label={t('Scale')}
                                    processingLabel={t('Scaling')}
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
                                                        title: t('Request failed'),
                                                        message: e.message,
                                                    })
                                                }
                                            })
                                    }}
                                />
                                <AcmButton key="cancel" variant="link" onClick={reset}>
                                    {t('Cancel')}
                                </AcmButton>
                            </ActionGroup>
                        </>
                    )}
                </AcmAlertContext.Consumer>
            </AcmForm>
        </AcmModal>
    )
}

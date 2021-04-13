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
import { MachinePool } from '../../../../../../resources/machine-pool'
import { patchResource } from '../../../../../../lib/resource-request'

export type ScaleMachinePoolModalProps = {
    machinePool?: MachinePool
    onClose?: () => void
    mode?: 'enable-autoscale' | 'disable-autoscale' | 'edit-autoscale' | 'edit-manualscale'
}

export function ScaleMachinePoolModal(props: ScaleMachinePoolModalProps) {
    const { t } = useTranslation(['cluster', 'common'])
    const [minReplicas, setMinReplicas] = useState<number>(0)
    const [maxReplicas, setMaxReplicas] = useState<number>(0)
    const [replicas, setReplicas] = useState<number>(0)

    const machineSetCount = props.machinePool?.status?.machineSets?.length ?? 0

    useEffect(() => {
        if (props.machinePool) {
            setMinReplicas(props.machinePool.spec?.autoscaling?.minReplicas ?? machineSetCount)
            setMaxReplicas(props.machinePool.spec?.autoscaling?.maxReplicas ?? machineSetCount)
            setReplicas(props.machinePool.spec?.replicas ?? props.machinePool?.status?.replicas ?? 0)
        }
    }, [props.machinePool, machineSetCount])

    function reset() {
        props.onClose?.()
        setMinReplicas(0)
        setMaxReplicas(0)
        setReplicas(0)
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={t(`machinePool.modal.scale.${props.mode}.title`)}
            isOpen={props.machinePool !== undefined}
            onClose={reset}
        >
            <AcmForm>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <p>
                                <Trans
                                    i18nKey={`cluster:machinePool.modal.scale.${props.mode}.message`}
                                    values={{
                                        name: props.machinePool!.metadata.name,
                                        number: props.machinePool?.status?.replicas,
                                    }}
                                    components={{ bold: <strong /> }}
                                />
                            </p>
                            {props.mode === 'disable-autoscale' || props.mode === 'edit-manualscale' ? (
                                <AcmNumberInput
                                    required
                                    label={t('machinePool.modal.scale.replicas.label')}
                                    id="scale"
                                    min={0}
                                    value={replicas}
                                    onChange={(event) => setReplicas(Number((event.target as HTMLInputElement).value))}
                                    onMinus={() => setReplicas(replicas - 1)}
                                    onPlus={() => setReplicas(replicas + 1)}
                                    validation={(count: number) => {
                                        if (count < 0) return t('machinePool.modal.scale.validation.positive')
                                        return undefined
                                    }}
                                />
                            ) : (
                                <>
                                    <AcmNumberInput
                                        required
                                        label={t('machinePool.modal.scale.minReplicas.label')}
                                        id="scale-min"
                                        min={machineSetCount}
                                        value={minReplicas}
                                        onChange={(event) =>
                                            setMinReplicas(Number((event.target as HTMLInputElement).value))
                                        }
                                        onMinus={() => setMinReplicas(minReplicas - 1)}
                                        onPlus={() => setMinReplicas(minReplicas + 1)}
                                        validation={(count: number) => {
                                            if (count > maxReplicas)
                                                return t('machinePool.modal.scale.maxReplicas.validation.greater')
                                            if (count < 0) return t('machinePool.modal.scale.validation.positive')
                                            return undefined
                                        }}
                                    />
                                    <AcmNumberInput
                                        required
                                        label={t('machinePool.modal.scale.maxReplicas.label')}
                                        id="scale-max"
                                        min={props.machinePool?.status?.machineSets?.length}
                                        value={maxReplicas}
                                        onChange={(event) =>
                                            setMaxReplicas(Number((event.target as HTMLInputElement).value))
                                        }
                                        onMinus={() => setMaxReplicas(maxReplicas - 1)}
                                        onPlus={() => setMaxReplicas(maxReplicas + 1)}
                                        validation={(count: number) => {
                                            if (count < minReplicas)
                                                return t('machinePool.modal.scale.maxReplicas.validation.greater')
                                            if (count < 0) return t('machinePool.modal.scale.validation.positive')
                                            return undefined
                                        }}
                                    />
                                </>
                            )}

                            <AcmAlertGroup isInline canClose padTop />
                            <ActionGroup>
                                <AcmSubmit
                                    id="submit"
                                    variant="primary"
                                    label={t('common:scale')}
                                    processingLabel={t('common:scaling')}
                                    onClick={() => {
                                        alertContext.clearAlerts()
                                        const patches = []
                                        if (props.mode === 'enable-autoscale') {
                                            patches.push(
                                                { op: 'remove', path: '/spec/replicas' },
                                                {
                                                    op: 'add',
                                                    path: '/spec/autoscaling',
                                                    value: { minReplicas, maxReplicas },
                                                }
                                            )
                                        } else if (props.mode === 'disable-autoscale') {
                                            patches.push(
                                                { op: 'remove', path: '/spec/autoscaling' },
                                                { op: 'add', path: '/spec/replicas', value: replicas }
                                            )
                                        } else if (props.mode === 'edit-autoscale') {
                                            patches.push({
                                                op: 'replace',
                                                path: '/spec/autoscaling',
                                                value: { minReplicas, maxReplicas },
                                            })
                                        } else if (props.mode === 'edit-manualscale') {
                                            patches.push({ op: 'replace', path: '/spec/replicas', value: replicas })
                                        }
                                        return patchResource(props.machinePool!, patches)
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

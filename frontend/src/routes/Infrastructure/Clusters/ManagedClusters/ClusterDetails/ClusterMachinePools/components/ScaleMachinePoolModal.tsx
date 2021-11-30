/* Copyright Contributors to the Open Cluster Management project */

import { MachinePool, patchResource } from '../../../../../../../resources'
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

export type ScaleMachinePoolModalProps = {
    machinePool?: MachinePool
    onClose?: () => void
    mode?: 'enable-autoscale' | 'disable-autoscale' | 'edit-autoscale' | 'edit-manualscale'
}

export function ScaleMachinePoolModal(props: ScaleMachinePoolModalProps) {
    const { t } = useTranslation()
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

    function getAcmModalTitle(props: ScaleMachinePoolModalProps, t: (string: String) => string) {
        switch (props.mode) {
            case 'enable-autoscale':
                return t('Enable autoscale')
            case 'disable-autoscale':
                return t('Disable autoscale')
            case 'edit-autoscale':
                return t('Edit autoscale')
            case 'edit-manualscale':
                return t('Scale machine pool')
            default:
                break
        }
    }
    function getAcmModalMessage(props: ScaleMachinePoolModalProps, t: (string: String) => string) {
        switch (props.mode) {
            case 'enable-autoscale':
                return t(
                    'This will automatically scale the machine sets in <bold>{{name}}</bold>. You can disable this later if you need to update the machine set replica count manually.'
                )
            case 'disable-autoscale':
                return t(
                    'This will require manually scaling the machine sets in <bold>{{name}}</bold>. There are currently {{number}} active machine set replicas in this machine pool.'
                )
            case 'edit-autoscale':
                return t('Specify the minimum and maximum replicas for <bold>{{name}}</bold>')
            case 'edit-manualscale':
                return t(
                    'Specify the desired machine set replica count for the <bold>{{name}}</bold>. Adjusting the size of the machine pool will result in the creation or destruction of nodes on the cluster.'
                )
            default:
                break
        }
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={getAcmModalTitle(props, t)}
            isOpen={props.machinePool !== undefined}
            onClose={reset}
        >
            <AcmForm>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <p>
                                <Trans
                                    i18nKey={getAcmModalMessage(props, t)}
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
                                    label={t('Machine set replica count')}
                                    id="scale"
                                    min={0}
                                    value={replicas}
                                    onChange={(event) => setReplicas(Number((event.target as HTMLInputElement).value))}
                                    onMinus={() => setReplicas(replicas - 1)}
                                    onPlus={() => setReplicas(replicas + 1)}
                                    validation={(count: number) => {
                                        if (count < 0) return t('Replica count must be a positive number.')
                                        return undefined
                                    }}
                                />
                            ) : (
                                <>
                                    <AcmNumberInput
                                        required
                                        label={t('Minimum replicas')}
                                        id="scale-min"
                                        min={machineSetCount}
                                        value={minReplicas}
                                        onChange={(event) =>
                                            setMinReplicas(Number((event.target as HTMLInputElement).value))
                                        }
                                        onMinus={() => setMinReplicas(minReplicas - 1)}
                                        onPlus={() => setMinReplicas(minReplicas + 1)}
                                        validation={(count: number) => {
                                            if (count < 0) return t('Replica count must be a positive number.')
                                            return undefined
                                        }}
                                    />
                                    <AcmNumberInput
                                        required
                                        label={t('Maximum replicas')}
                                        id="scale-max"
                                        min={props.machinePool?.status?.machineSets?.length}
                                        value={maxReplicas}
                                        onChange={(event) =>
                                            setMaxReplicas(Number((event.target as HTMLInputElement).value))
                                        }
                                        onMinus={() => setMaxReplicas(maxReplicas - 1)}
                                        onPlus={() => setMaxReplicas(maxReplicas + 1)}
                                        validation={(count: number) => {
                                            if (count < 0) return t('Replica count must be a positive number.')
                                            return undefined
                                        }}
                                    />
                                </>
                            )}

                            <AcmAlertGroup isInline canClose />
                            <ActionGroup>
                                <AcmSubmit
                                    id="submit"
                                    variant="primary"
                                    label={t('Scale')}
                                    processingLabel={t('Scaling')}
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

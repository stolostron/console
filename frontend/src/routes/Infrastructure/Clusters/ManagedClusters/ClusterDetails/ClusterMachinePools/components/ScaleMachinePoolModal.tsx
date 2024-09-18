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
} from '../../../../../../../ui-components'
import { ActionGroup, ModalVariant } from '@patternfly/react-core'
import { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from '../../../../../../../lib/acm-i18next'
import { TFunction } from 'react-i18next'

export type ScaleMachinePoolModalProps = {
  machinePool?: MachinePool
  onClose?: () => void
  mode?: 'enable-autoscale' | 'disable-autoscale' | 'edit-autoscale' | 'edit-manualscale'
}

const getModalTitle = (mode: ScaleMachinePoolModalProps['mode'], t: TFunction) => {
  switch (mode) {
    case 'disable-autoscale':
      return t('machinePool.modal.scale.disable-autoscale.title')
    case 'edit-autoscale':
      return t('machinePool.modal.scale.edit-autoscale.title')
    case 'edit-manualscale':
      return t('machinePool.modal.scale.edit-manualscale.title')
    case 'enable-autoscale':
      return t('machinePool.modal.scale.enable-autoscale.title')
  }
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

  /*
        t('machinePool.modal.scale.disable-autoscale.message')
        t('machinePool.modal.scale.edit-autoscale.message')
        t('machinePool.modal.scale.edit-manualscale.message')
        t('machinePool.modal.scale.enable-autoscale.message')
    */

  const positiveValidation = useCallback(
    (count: number) => {
      if (count < 0) return t('machinePool.modal.scale.validation.positive')
      return undefined
    },
    [t]
  )

  const maxReplicasValidation = useCallback(
    (count: number) => {
      if (count < minReplicas) return t('Maximum replicas must be greater than or equal to minimum replicas.')
      if (count < 0) return t('machinePool.modal.scale.validation.positive')
      return undefined
    },
    [minReplicas, t]
  )

  return (
    <AcmModal
      variant={ModalVariant.medium}
      title={getModalTitle(props.mode, t)}
      isOpen={props.machinePool !== undefined}
      onClose={reset}
    >
      <AcmForm>
        <AcmAlertContext.Consumer>
          {(alertContext) => (
            <>
              <p>
                <Trans
                  i18nKey={`machinePool.modal.scale.${props.mode}.message`}
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
                  validation={positiveValidation}
                />
              ) : (
                <>
                  <AcmNumberInput
                    required
                    label={t('machinePool.modal.scale.minReplicas.label')}
                    id="scale-min"
                    min={0}
                    value={minReplicas}
                    onChange={(event) => setMinReplicas(Number((event.target as HTMLInputElement).value))}
                    onMinus={() => setMinReplicas(minReplicas - 1)}
                    onPlus={() => setMinReplicas(minReplicas + 1)}
                    validation={positiveValidation}
                  />
                  <AcmNumberInput
                    required
                    label={t('machinePool.modal.scale.maxReplicas.label')}
                    id="scale-max"
                    min={minReplicas}
                    value={maxReplicas}
                    onChange={(event) => setMaxReplicas(Number((event.target as HTMLInputElement).value))}
                    onMinus={() => setMaxReplicas(maxReplicas - 1)}
                    onPlus={() => setMaxReplicas(maxReplicas + 1)}
                    validation={maxReplicasValidation}
                  />
                </>
              )}

              <AcmAlertGroup isInline canClose />
              <ActionGroup>
                <AcmSubmit
                  id="submit"
                  variant="primary"
                  label={t('scale')}
                  processingLabel={t('scaling')}
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

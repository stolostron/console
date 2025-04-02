/* Copyright Contributors to the Open Cluster Management project */

import {
  AcmAlertContext,
  AcmAlertGroup,
  AcmButton,
  AcmForm,
  AcmModal,
  AcmSelect,
  AcmSubmit,
  AcmTextInput,
  Provider,
} from '../../../../../ui-components'
import { ActionGroup, Checkbox, ModalVariant, SelectOption } from '@patternfly/react-core'
import { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { getErrorInfo } from '../../../../../components/ErrorPage'
import { CableDriver, SubmarinerConfig, submarinerConfigDefault } from '../../../../../resources'
import { Cluster, patchResource } from '../../../../../resources/utils'

export type EditSubmarinerConfigModalProps = {
  submarinerConfig?: SubmarinerConfig
  cluster?: Cluster
  onClose?: () => void
}

export function EditSubmarinerConfigModal(props: EditSubmarinerConfigModalProps) {
  const { t } = useTranslation()

  const [nattPort, setNattPort] = useState<string | undefined>()
  const [nattEnable, setNattEnable] = useState(submarinerConfigDefault.nattEnable)
  const [cableDriver, setCableDriver] = useState<CableDriver | undefined>()
  const [gateways, setGateways] = useState<string | undefined>()
  const [awsInstanceType, setAwsInstanceType] = useState<string | undefined>()

  const reset = useCallback(
    function reset() {
      props.onClose?.()
      setNattPort(undefined)
      setNattEnable(submarinerConfigDefault.nattEnable)
      setCableDriver(undefined)
      setGateways(undefined)
      setAwsInstanceType(undefined)
    },
    [props, setNattPort, setNattEnable, setCableDriver, setGateways, setAwsInstanceType]
  )

  useEffect(() => {
    if (props.submarinerConfig) {
      setNattPort(props.submarinerConfig?.spec.IPSecNATTPort?.toString())
      setNattEnable(
        props.submarinerConfig?.spec.NATTEnable === undefined
          ? submarinerConfigDefault.nattEnable
          : props.submarinerConfig?.spec.NATTEnable
      )
      setCableDriver(props.submarinerConfig?.spec.cableDriver)
      setGateways(props.submarinerConfig?.spec.gatewayConfig?.gateways?.toString())
      setAwsInstanceType(props.submarinerConfig?.spec.gatewayConfig?.aws?.instanceType)
    } else {
      reset()
    }
  }, [props.submarinerConfig, reset])

  return (
    <AcmModal
      title={t('submariner.update.form.title')}
      isOpen={props.submarinerConfig !== undefined}
      variant={ModalVariant.medium}
      onClose={reset}
    >
      <AcmAlertContext.Consumer>
        {(alertContext) => (
          <AcmForm>
            <div>
              <Trans i18nKey="submariner.update.form.message" components={{ bold: <strong /> }} />
            </div>
            <AcmTextInput
              id="natt-port"
              type="number"
              label={t('submariner.install.form.nattport')}
              placeholder={t('submariner.install.form.port.placeholder')}
              labelHelp={t('submariner.install.form.nattport.labelHelp')}
              value={nattPort}
              onChange={(_event, port) => setNattPort(port)}
            />

            <Checkbox
              id="natt-enable"
              label={t('submariner.install.form.nattenable')}
              isChecked={nattEnable}
              onChange={(_event, val) => setNattEnable(val)}
            />
            <AcmSelect
              id="cable-driver"
              label={t('submariner.install.form.cabledriver')}
              placeholder={t('submariner.install.form.cabledriver.placeholder')}
              labelHelp={t('submariner.install.form.cabledriver.labelHelp')}
              value={cableDriver}
              onChange={(driver) => setCableDriver(CableDriver[driver as keyof typeof CableDriver])}
            >
              {Object.values(CableDriver).map((cb) => (
                <SelectOption key={cb} value={cb}>
                  {cb}
                </SelectOption>
              ))}
            </AcmSelect>
            <AcmTextInput
              id="gateways"
              type="number"
              label={t('submariner.install.form.gateways')}
              placeholder={t('submariner.install.form.gateways.placeholder')}
              labelHelp={t('submariner.install.form.gateways.labelHelp')}
              value={gateways}
              onChange={(_event, gateways) => setGateways(gateways)}
            />
            {props.cluster?.provider === Provider.aws && (
              <AcmTextInput
                id="aws-instance-type"
                label={t('submariner.install.form.instancetype')}
                placeholder={t('submariner.install.form.instancetype.placeholder')}
                labelHelp={t('submariner.install.form.instancetype.labelHelp.aws')}
                value={awsInstanceType}
                onChange={(_event, instanceType) => setAwsInstanceType(instanceType)}
              />
            )}

            <AcmAlertGroup isInline canClose />
            <ActionGroup>
              <AcmSubmit
                id="save"
                variant="primary"
                label={t('save')}
                processingLabel={t('saving')}
                onClick={() => {
                  alertContext.clearAlerts()

                  const patch: { op: string; path: string; value?: unknown }[] = [
                    {
                      op: 'replace',
                      path: '/spec/IPSecNATTPort',
                      value: nattPort ? parseInt(nattPort) : submarinerConfigDefault.nattPort,
                    },
                    {
                      op: 'replace',
                      path: '/spec/NATTEnable',
                      value: nattEnable != undefined ? nattEnable : submarinerConfigDefault.nattEnable,
                    },
                    {
                      op: 'replace',
                      path: '/spec/cableDriver',
                      value: cableDriver ?? submarinerConfigDefault.cableDriver,
                    },
                  ]
                  if (props.submarinerConfig?.spec.gatewayConfig === undefined) {
                    patch.push({ op: 'add', path: '/spec/gatewayConfig', value: {} })
                  }
                  patch.push({
                    op: 'replace',
                    path: '/spec/gatewayConfig/gateways',
                    value: gateways ? parseInt(gateways) : submarinerConfigDefault.gateways,
                  })
                  if (props.submarinerConfig?.spec.gatewayConfig?.aws === undefined && awsInstanceType) {
                    patch.push({ op: 'add', path: '/spec/gatewayConfig/aws', value: {} })
                  }
                  if (awsInstanceType !== undefined) {
                    patch.push({
                      op: 'add',
                      path: '/spec/gatewayConfig/aws/instanceType',
                      value: awsInstanceType ?? submarinerConfigDefault.awsInstanceType,
                    })
                  }
                  return patchResource(props.submarinerConfig!, patch)
                    .promise.then(() => reset())
                    .catch((err) => {
                      alertContext.addAlert(getErrorInfo(err, t))
                    })
                }}
              />
              <AcmButton variant="link" onClick={reset}>
                {t('cancel')}
              </AcmButton>
            </ActionGroup>
          </AcmForm>
        )}
      </AcmAlertContext.Consumer>
    </AcmModal>
  )
}

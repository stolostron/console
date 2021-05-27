/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect, useCallback } from 'react'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmForm,
    AcmSubmit,
    AcmModal,
    AcmTextInput,
    AcmSelect,
    AcmButton,
    Provider,
} from '@open-cluster-management/ui-components'
import { ModalVariant, SelectOption, ActionGroup } from '@patternfly/react-core'
import { useTranslation, Trans } from 'react-i18next'
import { SubmarinerConfig, CableDriver, submarinerConfigDefault } from '../../../../resources/submariner-config'
import { Cluster } from '../../../../lib/get-cluster'
import { patchResource } from '../../../../lib/resource-request'
import { getErrorInfo } from '../../../../components/ErrorPage'

export type EditSubmarinerConfigModalProps = {
    submarinerConfig?: SubmarinerConfig
    cluster?: Cluster
    onClose?: () => void
}

export function EditSubmarinerConfigModal(props: EditSubmarinerConfigModalProps) {
    const { t } = useTranslation(['cluster', 'common'])

    const [ikePort, setIkePort] = useState<string | undefined>()
    const [nattPort, setNattPort] = useState<string | undefined>()
    const [cableDriver, setCableDriver] = useState<CableDriver | undefined>()
    const [gateways, setGateways] = useState<string | undefined>()
    const [awsInstanceType, setAwsInstanceType] = useState<string | undefined>()

    const reset = useCallback(
        function reset() {
            props.onClose?.()
            setIkePort(undefined)
            setNattPort(undefined)
            setCableDriver(undefined)
            setGateways(undefined)
            setAwsInstanceType(undefined)
        },
        [props, setIkePort, setNattPort, setCableDriver, setGateways, setAwsInstanceType]
    )

    useEffect(() => {
        if (props.submarinerConfig) {
            setIkePort(props.submarinerConfig?.spec.IPSecIKEPort?.toString())
            setNattPort(props.submarinerConfig?.spec.IPSecNATTPort?.toString())
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
                            <Trans i18nKey="cluster:submariner.update.form.message" components={{ bold: <strong /> }} />
                        </div>
                        <AcmTextInput
                            id="ike-port"
                            type="number"
                            label={t('submariner.install.form.ikeport')}
                            placeholder={t('submariner.install.form.port.placeholder')}
                            labelHelp={t('submariner.install.form.ikeport.labelHelp')}
                            value={ikePort}
                            onChange={(port) => setIkePort(port)}
                        />
                        <AcmTextInput
                            id="natt-port"
                            type="number"
                            label={t('submariner.install.form.nattport')}
                            placeholder={t('submariner.install.form.port.placeholder')}
                            labelHelp={t('submariner.install.form.nattport.labelHelp')}
                            value={nattPort}
                            onChange={(port) => setNattPort(port)}
                        />
                        <AcmSelect
                            id="cable-driver"
                            label={t('submariner.install.form.cabledriver')}
                            placeholder={t('submariner.install.form.cabledriver.placeholder')}
                            labelHelp={t('submariner.install.form.cabledriver.labelHelp')}
                            value={cableDriver}
                            onChange={(driver: CableDriver) => setCableDriver(driver)}
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
                            onChange={(gateways) => setGateways(gateways)}
                        />
                        {props.cluster?.provider === Provider.aws && (
                            <AcmTextInput
                                id="aws-instance-type"
                                label={t('submariner.install.form.instancetype')}
                                placeholder={t('submariner.install.form.instancetype.placeholder')}
                                labelHelp={t('submariner.install.form.instancetype.labelHelp')}
                                value={awsInstanceType}
                                onChange={(instanceType) => setAwsInstanceType(instanceType)}
                            />
                        )}

                        <AcmAlertGroup isInline canClose />
                        <ActionGroup>
                            <AcmSubmit
                                id="save"
                                variant="primary"
                                label={t('common:save')}
                                processingLabel={t('common:saving')}
                                onClick={() => {
                                    alertContext.clearAlerts()

                                    const patch: { op: string; path: string; value?: unknown }[] = [
                                        {
                                            op: 'replace',
                                            path: '/spec/IPSecIKEPort',
                                            value: ikePort ? parseInt(ikePort) : submarinerConfigDefault.ikePort,
                                        },
                                        {
                                            op: 'replace',
                                            path: '/spec/IPSecNATTPort',
                                            value: nattPort ? parseInt(nattPort) : submarinerConfigDefault.nattPort,
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
                                    if (
                                        props.submarinerConfig?.spec.gatewayConfig?.aws === undefined &&
                                        awsInstanceType
                                    ) {
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
                                            const errorInfo = getErrorInfo(err)
                                            alertContext.addAlert({
                                                type: 'danger',
                                                title: errorInfo.title,
                                                message: errorInfo.message,
                                            })
                                        })
                                }}
                            />
                            <AcmButton variant="link" onClick={reset}>
                                {t('common:cancel')}
                            </AcmButton>
                        </ActionGroup>
                    </AcmForm>
                )}
            </AcmAlertContext.Consumer>
        </AcmModal>
    )
}

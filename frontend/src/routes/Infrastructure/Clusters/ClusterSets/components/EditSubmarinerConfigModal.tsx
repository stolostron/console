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
} from '@open-cluster-management/ui-components'
import { ActionGroup, Checkbox, ModalVariant, SelectOption } from '@patternfly/react-core'
import { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { getErrorInfo } from '../../../../../components/ErrorPage'
import {
    CableDriver,
    Cluster,
    patchResource,
    SubmarinerConfig,
    submarinerConfigDefault,
} from '../../../../../resources'

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
            title={t('Edit Submariner configuration')}
            isOpen={props.submarinerConfig !== undefined}
            variant={ModalVariant.medium}
            onClose={reset}
        >
            <AcmAlertContext.Consumer>
                {(alertContext) => (
                    <AcmForm>
                        <div>
                            <Trans
                                i18nKey="Editing the <bold>SubmarinerConfig</bold> will update the configurations of the Submariner add-on on the managed cluster. It may take a few minutes for the changes to take effect."
                                components={{ bold: <strong /> }}
                            />
                        </div>
                        <AcmTextInput
                            id="natt-port"
                            type="number"
                            label={t('IPSec NAT-T port')}
                            placeholder={t('Enter port number')}
                            labelHelp={t(
                                'The Submariner creates the IPsec tunnel between the clusters.  This port is used for IPsec NAT traversal. (default 4500)'
                            )}
                            value={nattPort}
                            onChange={(port) => setNattPort(port)}
                        />

                        <Checkbox
                            id="natt-enable"
                            label={t('Enable NAT-T')}
                            isChecked={nattEnable}
                            onChange={setNattEnable}
                        />
                        <AcmSelect
                            id="cable-driver"
                            label={t('Cable driver')}
                            placeholder={t('Select cable driver')}
                            labelHelp={t(
                                'The Submariner gateway cable driver, Available options are: libreswan (default), wireguard, and vxlan.'
                            )}
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
                            label={t('Gateway count')}
                            placeholder={t('Enter gateway count')}
                            labelHelp={t(
                                'The number of worker nodes  that will be used to deploy the Submariner gateway component on the managed cluster. If the value is greater than 1, the Submariner gateway HA will be enabled automatically. (default 1)'
                            )}
                            value={gateways}
                            onChange={(gateways) => setGateways(gateways)}
                        />
                        {props.cluster?.provider === Provider.aws && (
                            <AcmTextInput
                                id="aws-instance-type"
                                label={t('Instance type')}
                                placeholder={t('Select instance type')}
                                labelHelp={t(
                                    'The Amazon Web Services EC2 instance type of the gateway node that will be created on the managed cluster. (default c5d.large)'
                                )}
                                value={awsInstanceType}
                                onChange={(instanceType) => setAwsInstanceType(instanceType)}
                            />
                        )}

                        <AcmAlertGroup isInline canClose />
                        <ActionGroup>
                            <AcmSubmit
                                id="save"
                                variant="primary"
                                label={t('Save')}
                                processingLabel={t('Saving')}
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
                                            value:
                                                nattEnable != undefined
                                                    ? nattEnable
                                                    : submarinerConfigDefault.nattEnable,
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
                                {t('Cancel')}
                            </AcmButton>
                        </ActionGroup>
                    </AcmForm>
                )}
            </AcmAlertContext.Consumer>
        </AcmModal>
    )
}

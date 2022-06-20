/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { HostedClusterNetworkStep, LoadingState } from 'openshift-assisted-ui-lib/cim'
import { agentsState } from '../../../../../../../../atoms'
import { useRecoilValue, waitForAll } from 'recoil'
import { FormikProps } from 'formik'
import isEqual from 'lodash/isEqual'

import { onSaveAgent } from '../utils'
import { HypershiftAgentContext } from './HypershiftAgentContext'
import { Secret } from '../../../../../../../../resources'

type FormControl = {
    active: any
    disabled?: VoidFunction
    reverse?: (control: { active: any }, templateObject: any) => void
    validate?: VoidFunction
    summary?: VoidFunction
    step?: any
    additionalProps?: { [x: string]: string }
    onNext: () => Promise<void>
}

type NetworkFormProps = {
    control: FormControl
    handleChange: (control: FormControl) => void
    controlProps: Secret
}

const NetworkForm: React.FC<NetworkFormProps> = ({ control, handleChange, controlProps }) => {
    const { nodePools, isAdvancedNetworking, setIsAdvancedNetworking } = React.useContext(HypershiftAgentContext)
    const [agents] = useRecoilValue(waitForAll([agentsState]))

    const formRef = React.useRef<FormikProps<any>>(null)

    const onValuesChanged = React.useCallback((values) => {
        if (!isEqual(values, control.active)) {
            control.active = values
            setIsAdvancedNetworking(values.isAdvanced)
            control.step.title.isComplete = false
            handleChange(control)
        }
        // eslint-disable-next-line
    }, [])

    control.validate = () => {
        return formRef?.current?.submitForm().then(() => {
            return formRef?.current?.errors
        })
    }

    control.summary = () => {
        const summary = [
            {
                term: 'Machine CIDR',
                desc: control.active.machineCIDR,
            },
            {
                term: 'SSH public key',
                desc: control.active.sshPublicKey,
            },
        ]

        if (control.active.isAdvanced) {
            summary.push(
                ...[
                    {
                        term: 'Cluster CIDR',
                        desc: control.active.podCIDR,
                    },
                    {
                        term: 'Service CIDR',
                        desc: control.active.serviceCIDR,
                    },
                ]
            )
        }

        return summary
    }

    /*
    control.reverse = (
        control: {
            active: FormControl['active']
        },
        templateObject: any
    ) => {
            const serviceCIDR = getValue(templateObject, 'HostedCluster[0].spec.networking.serviceCIDR')
            const podCIDR = getValue(templateObject, 'HostedCluster[0].spec.networking.podCIDR')
            const active = {
                ...control.active,
                machineCIDR: getValue(templateObject, 'HostedCluster[0].spec.networking.machineCIDR'),
                serviceCIDR: serviceCIDR || '172.31.0.0/16',
                podCIDR: podCIDR || '192.168.122.0/24',
                sshPublicKey: getValue(templateObject, 'Secret[1].stringData')?.['id_rsa.pub'] || '',
                isAdvanced: formRef.current ? formRef.current.values.isAdvanced : isAdvancedNetworking,
            }

            if (!isEqual(active, control.active)) {
                control.active = active
            }

            if (formRef.current && !isEqual(active, formRef.current.values)) {
                formRef.current.setValues(active)
            }
    }
    */

    const requestedAgentIDs =
        nodePools?.reduce<string[]>((ids, nodePool) => {
            ids.push(...(nodePool.manualHostSelect ? nodePool.selectedAgentIDs : nodePool.autoSelectedAgentIDs))
            return ids
        }, []) || []

    return agents ? (
        <HostedClusterNetworkStep
            formRef={formRef}
            agents={agents.filter((a) => requestedAgentIDs.includes(a.metadata?.uid))}
            onValuesChanged={onValuesChanged}
            onEditHostname={onSaveAgent}
            initAdvancedNetworking={isAdvancedNetworking}
            initSSHPublicKey={controlProps?.stringData?.['ssh-publickey']}
        />
    ) : (
        <LoadingState />
    )
}

export default NetworkForm

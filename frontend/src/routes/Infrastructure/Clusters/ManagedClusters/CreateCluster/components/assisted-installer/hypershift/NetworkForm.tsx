/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { HostedClusterNetworkStep, LoadingState, NetworkFormValues } from 'openshift-assisted-ui-lib/cim'
import { useRecoilValue, waitForAll } from 'recoil'
import { FormikProps } from 'formik'
import isEqual from 'lodash/isEqual'
import isMatch from 'lodash/isMatch'

import { agentsState, infrastructuresState } from '../../../../../../../../atoms'
import { isBMPlatform } from '../../../../../../InfraEnvironments/utils'
import { getTemplateValue } from '../utils'

import { HypershiftAgentContext } from './HypershiftAgentContext'

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
    templateYAML: string
}

const NetworkForm: React.FC<NetworkFormProps> = ({ control, handleChange, templateYAML }) => {
    const { nodePools, isAdvancedNetworking, setIsAdvancedNetworking, infraEnvNamespace } =
        React.useContext(HypershiftAgentContext)
    const [agents, infrastructures] = useRecoilValue(waitForAll([agentsState, infrastructuresState]))

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

    const { matchingAgents, count } = nodePools?.reduce<{ matchingAgents: string[]; count: number }>(
        (acc, nodePool) => {
            const labels = nodePool.agentLabels.reduce((acc, curr) => {
                acc[curr.key] = curr.value
                return acc
            }, {} as { [key: string]: string })
            const mAgents = agents.filter(
                (a) => a.metadata.namespace === infraEnvNamespace && isMatch(a.metadata.labels || {}, labels)
            )
            acc.matchingAgents.push(...mAgents)
            acc.count += nodePool.count
            return acc
        },
        { matchingAgents: [], count: 0 }
    ) || { matchingAgents: [], count: 0 }

    const initialValues: NetworkFormValues = React.useMemo(() => {
        // To preserve form values on Back button
        // Find a better way than parsing the yaml - is there already a parsed up-to-date template?
        const machineCIDR = getTemplateValue(templateYAML, 'machineCIDR', '')
        const serviceCIDR = getTemplateValue(templateYAML, 'serviceCIDR', '172.31.0.0/16')
        const podCIDR = getTemplateValue(templateYAML, 'podCIDR', '10.132.0.0/14')
        const sshPublicKey = getTemplateValue(templateYAML, 'id_rsa.pub', '')

        const httpProxy = getTemplateValue(templateYAML, 'httpProxy', '')
        const httpsProxy = getTemplateValue(templateYAML, 'httpsProxy', '')
        const noProxy = getTemplateValue(templateYAML, 'noProxy', '')
        const enableProxy = !!(httpProxy || httpsProxy || noProxy)

        const nodePortPort: number = parseInt(getTemplateValue(templateYAML, 'port', '0'))
        const nodePortAddress = getTemplateValue(templateYAML, 'address', '')
        const isNodePort: boolean = nodePortPort !== undefined || !!nodePortAddress

        return {
            machineCIDR,
            isAdvanced: isAdvancedNetworking,
            sshPublicKey,
            serviceCIDR,
            podCIDR,
            enableProxy,
            httpProxy,
            httpsProxy,
            noProxy,
            apiPublishingStrategy: isNodePort || isBMPlatform(infrastructures[0]) ? 'NodePort' : 'LoadBalancer',
            nodePortPort,
            nodePortAddress,
        }
    }, [templateYAML, infrastructures, isAdvancedNetworking])

    return agents ? (
        <HostedClusterNetworkStep
            formRef={formRef}
            agents={matchingAgents}
            count={count}
            onValuesChanged={onValuesChanged}
            initialValues={initialValues}
        />
    ) : (
        <LoadingState />
    )
}

export default NetworkForm

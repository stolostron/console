/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'
import { FormikProps } from 'formik'
import { debounce, isEmpty, isEqual } from 'lodash'
import {
    agentClusterInstallsState,
    agentsState,
    clusterDeploymentsState,
    configMapsState,
} from '../../../../../../../atoms'
import { getAIConfigMap, onHostsNext } from './utils'

import './hosts-form.css'

const { ACMClusterDeploymentHostsStep, getTotalCompute, LoadingState } = CIM

type FormControl = {
    active?: CIM.ClusterDeploymentHostsSelectionValues
    agentClusterInstall: CIM.AgentClusterInstallK8sResource
    validate?: VoidFunction
    summary?: VoidFunction
    resourceJSON?: any
    step?: any
}

type HostsFormProps = {
    control: FormControl
    resourceJSON: any
    handleChange: (control: FormControl) => void
}

const HostsForm: React.FC<HostsFormProps> = ({ control, handleChange }) => {
    const [error, setError] = useState<string>()
    const formRef = useRef<FormikProps<CIM.ClusterDeploymentHostsSelectionValues>>(null)
    const [agents, clusterDeployments, agentClusterInstalls, configMaps] = useRecoilValue(
        waitForAll([agentsState, clusterDeploymentsState, agentClusterInstallsState, configMapsState])
    )
    const aiConfigMap = getAIConfigMap(configMaps)
    const { resourceJSON = {} } = control
    const { createResources = [] } = resourceJSON
    const cdName = createResources.find((r: { kind: string }) => r.kind === 'ClusterDeployment').metadata.name
    const aciName = createResources.find((r: { kind: string }) => r.kind === 'AgentClusterInstall').metadata.name

    const clusterDeployment = useMemo(
        () => clusterDeployments.find((cd) => cd.metadata.name === cdName && cd.metadata.namespace === cdName),
        [cdName, clusterDeployments]
    )
    const agentClusterInstall = useMemo(
        () => agentClusterInstalls.find((aci) => aci.metadata.name === aciName && aci.metadata.namespace === aciName),
        [aciName, agentClusterInstalls]
    )

    useEffect(() => {
        if (control.active && formRef?.current?.values && !isEqual(control.active, formRef.current.values)) {
            formRef?.current?.setValues(control.active, false)
        }
        control.validate = async () => {
            setError(undefined)
            formRef?.current?.setFieldError('patchError', undefined)
            const autoSelectHosts = formRef?.current?.values.autoSelectHosts
            const hostCount = formRef?.current?.values.hostCount
            const ids = formRef?.current?.values.autoSelectHosts
                ? formRef?.current?.values.autoSelectedHostIds
                : formRef?.current?.values.selectedHostIds
            const selectedAgents = agents.filter((a) => ids?.includes(a.metadata.uid))
            control.summary = () => {
                return [
                    {
                        term: 'Auto select hosts',
                        desc: autoSelectHosts ? 'Yes' : 'No',
                    },
                    {
                        term: 'Number of hosts',
                        desc: hostCount,
                    },
                    {
                        term: 'Total compute',
                        desc: getTotalCompute(selectedAgents),
                    },
                ]
            }
            await formRef?.current?.submitForm()
            if (!isEmpty(formRef?.current?.errors)) {
                return formRef?.current?.errors
            }

            try {
                await onHostsNext({ values: control.active, clusterDeployment, agents, agentClusterInstall })
            } catch (err) {
                const msg = err instanceof Error ? err?.message : undefined
                setError(msg || 'An error occured')
                return {
                    resourcesError: 'Failed patching resources',
                }
            }
        }
    }, [control.active, clusterDeployment, agents])

    const onValuesChanged = useCallback(
        debounce((values) => {
            if (!isEqual(values, control.active)) {
                control.active = values
                control.step.title.isComplete = false
                handleChange(control)
            }
            // eslint-disable-next-line
        }, 300),
        []
    )

    return clusterDeployment && agentClusterInstall ? (
        <div className="hosts-form">
            <ACMClusterDeploymentHostsStep
                formRef={formRef}
                onValuesChanged={onValuesChanged}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={agents}
                error={error}
                aiConfigMap={aiConfigMap}
            />
        </div>
    ) : (
        <LoadingState />
    )
}

export default HostsForm

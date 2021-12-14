/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useRef, useEffect, useState } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'
import { FormikProps } from 'formik'
import { debounce, isEmpty, isEqual } from 'lodash'
import { agentsState } from '../../../../../../../atoms'
import { useAgentClusterInstall, onHostsNext, useAIConfigMap, useClusterDeployment } from './utils'
import { CIMHostsFormProps } from './types'

import './cim-hosts-form.css'

const { ACMClusterDeploymentHostsStep, LoadingState, getTotalCompute } = CIM

const CIMHostsForm: React.FC<CIMHostsFormProps> = ({ control, handleChange }) => {
    const { resourceJSON = {} } = control
    const { createResources = [] } = resourceJSON
    const { name: cdName, namespace: cdNamespace } = createResources.find(
        (r: { kind: string }) => r.kind === 'ClusterDeployment'
    ).metadata
    const { name: aciName, namespace: aciNamespace } = createResources.find(
        (r: { kind: string }) => r.kind === 'AgentClusterInstall'
    ).metadata

    const [error, setError] = useState<string>()
    const formRef = useRef<FormikProps<CIM.ClusterDeploymentHostsSelectionValues>>(null)
    const [agents] = useRecoilValue(waitForAll([agentsState]))

    const aiConfigMap = useAIConfigMap()
    const clusterDeployment = useClusterDeployment({ name: cdName, namespace: cdNamespace })
    const agentClusterInstall = useAgentClusterInstall({ name: aciName, namespace: aciNamespace })

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
                await onHostsNext({ values: control.active, clusterDeployment, agents })
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

    return agents && clusterDeployment && agentClusterInstall ? (
        <div className="hosts-form" id="hosts-form">
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

export default CIMHostsForm

/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce, isEqual, isEmpty } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import { FormikProps } from 'formik'

import { AIHostsFormProps } from './types'
import {
    useAgentClusterInstall,
    useAIConfigMap,
    useClusterDeployment,
    onDiscoveryHostsNext,
    useInfraEnv,
    getClusterDeploymentLink,
    fetchNMState,
    fetchSecret,
    onSaveBMH,
    onSaveAgent,
    getOnCreateBMH,
    useAgentsOfAIFlow,
    useBMHsOfAIFlow,
    getOnSaveISOParams,
    canEditHost,
    useNMStatesOfNamespace,
    useOnDeleteHost,
    onChangeBMHHostname,
    useClusterImages,
} from './utils'
import { isBMPlatform } from '../../../../../InfraEnvironments/utils'
import { BulkActionModel, IBulkActionModelProps } from '../../../../../../../components/BulkActionModel'

const {
    ACMClusterDeploymentHostsDiscoveryStep,
    LoadingState,
    getTotalCompute,
    getAgentsHostsNames,
    ACMFeatureSupportLevelProvider,
} = CIM

const AIHostsForm: React.FC<AIHostsFormProps> = ({ control, handleChange }) => {
    const { resourceJSON = {} } = control
    const { createResources = [] } = resourceJSON
    const cdName = createResources.find((r: { kind: string }) => r.kind === 'ClusterDeployment').metadata.name
    const aciName = createResources.find((r: { kind: string }) => r.kind === 'AgentClusterInstall').metadata.name

    const [error, setError] = useState<string>()
    const formRef = useRef<FormikProps<CIM.ClusterDeploymentHostsDiscoveryValues>>(null)

    const aiConfigMap = useAIConfigMap()
    const clusterDeployment = useClusterDeployment({ name: cdName, namespace: cdName })
    const agentClusterInstall = useAgentClusterInstall({ name: aciName, namespace: aciName })
    const filteredAgents = useAgentsOfAIFlow({ name: cdName, namespace: cdName })
    const filteredBMHs = useBMHsOfAIFlow({ name: cdName, namespace: cdName })
    const infraEnv = useInfraEnv({ name: cdName, namespace: cdName })

    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<CIM.AgentK8sResource> | { open: false }>(
        { open: false }
    )
    const nmStates = useNMStatesOfNamespace(infraEnv.metadata.namespace)
    const onDeleteHost = useOnDeleteHost(setBulkModalProps, agentClusterInstall, filteredBMHs, nmStates)

    const usedHostnames = useMemo(() => getAgentsHostsNames(filteredAgents), [filteredAgents])

    const setErrorHandler = (err: any) => {
        const msg = err instanceof Error ? err?.message : undefined
        setError(msg || 'An error occured')
    }

    const clusterImages = useClusterImages()

    useEffect(() => {
        if (control.active && formRef?.current?.values && !isEqual(control.active, formRef.current.values)) {
            formRef?.current?.setValues(control.active, false)
        }
        control.validate = async () => {
            setError(undefined)
            formRef?.current?.setFieldError('patchError', undefined)

            control.summary = () => {
                return [
                    {
                        term: 'Auto select hosts',
                        desc: 'No',
                    },
                    {
                        term: 'Number of hosts',
                        desc: filteredAgents.length,
                    },
                    {
                        term: 'Total compute',
                        desc: getTotalCompute(filteredAgents),
                    },
                ]
            }
            await formRef?.current?.submitForm()
            if (!isEmpty(formRef?.current?.errors)) {
                return formRef?.current?.errors
            }

            try {
                await onDiscoveryHostsNext({
                    values: control.active || {},
                    agents: filteredAgents,
                    clusterDeployment,
                    agentClusterInstall,
                })
            } catch (err) {
                setErrorHandler(err)
                return {
                    resourcesError: 'Failed patching resources',
                }
            }
        }
    }, [control.active, clusterDeployment, filteredAgents])

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

    return clusterDeployment && agentClusterInstall && clusterImages ? (
        // onApproveAgent is missing here - done automatically in the AI flow
        <ACMFeatureSupportLevelProvider clusterImages={clusterImages}>
            <BulkActionModel<CIM.AgentK8sResource> {...bulkModalProps} />
            <ACMClusterDeploymentHostsDiscoveryStep
                formRef={formRef}
                error={error}
                // clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={filteredAgents}
                bareMetalHosts={filteredBMHs}
                aiConfigMap={aiConfigMap}
                infraEnv={infraEnv}
                usedHostnames={usedHostnames}
                onValuesChanged={onValuesChanged}
                onCreateBMH={getOnCreateBMH(infraEnv)}
                onDeleteHost={onDeleteHost}
                canDeleteAgent={(agent?: CIM.AgentK8sResource, bmh?: CIM.BareMetalHostK8sResource) =>
                    !!nmStates && (!!agent || !!bmh)
                }
                onSaveAgent={onSaveAgent}
                canEditHost={canEditHost}
                onSaveBMH={onSaveBMH}
                onSaveISOParams={getOnSaveISOParams(infraEnv)}
                onFormSaveError={setErrorHandler}
                fetchSecret={fetchSecret}
                fetchNMState={fetchNMState}
                isBMPlatform={isBMPlatform(infraEnv)}
                getClusterDeploymentLink={getClusterDeploymentLink}
                onChangeBMHHostname={onChangeBMHHostname}
            />
        </ACMFeatureSupportLevelProvider>
    ) : (
        <LoadingState />
    )
}

export default AIHostsForm

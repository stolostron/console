/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce, isEqual, isEmpty } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'
import { FormikProps } from 'formik'

import { agentsState, bareMetalAssetsState } from '../../../../../../../atoms'
import { AIHostsFormProps } from './types'
import {
    useAgentClusterInstall,
    useAIConfigMap,
    useClusterDeployment,
    onDiscoverHostsNext,
    useInfraEnv,
    onApproveAgent,
    getClusterDeploymentLink,
    getOnDeleteHost,
    canDeleteAgent,
    fetchNMState,
    fetchSecret,
    onSaveBMH,
    onSaveAgent,
    getOnCreateBMH,
} from './utils'
import { isBMPlatform } from '../../../../../InfraEnvironments/utils'

const { ACMClusterDeploymentHostsDiscoveryStep, LoadingState, INFRAENV_GENERATED_AI_FLOW, getTotalCompute } = CIM

/*
const clusterName = 'mlibra-01'
const mockCD = {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterDeployment',
    metadata: {
        annotations: {
            'agentBareMetal-agentSelector/autoSelect': 'true',
        },
        labels: null,
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        baseDomain: 'redhat.com',
        clusterInstallRef: {
            group: 'extensions.hive.openshift.io',
            kind: 'AgentClusterInstall',
            name: clusterName,
            version: 'v1beta1',
        },
        clusterName,
        platform: {
            agentBareMetal: {
                agentSelector: {
                    matchLabels: null,
                    // TODO(mlibra)
                },
            },
        },
        pullSecretRef: {
            name: 'pullsecret-cluster-test',
        },
    },
}

const mockACI = {
    apiVersion: 'extensions.hive.openshift.io/v1beta1',
    kind: 'AgentClusterInstall',
    metadata: { name: 'test', namespace: 'test' },
    spec: {
        clusterDeploymentRef: { name: 'test' },
        holdInstallation: true,
        provisionRequirements: { controlPlaneAgents: 3 },
        imageSetRef: { name: 'ocp-release48' },
        networking: {
            clusterNetwork: [{ cidr: '10.128.0.0/14', hostPrefix: 23 }],
            serviceNetwork: ['172.30.0.0/16'],
        },
    },
}

export const mockInfraEnv1 = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'InfraEnv',
    metadata: {
        labels: {
            networkType: 'dhcp',
        },
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        agentLabels: {
            'agentBareMetal-generated-infraenv-ai-flow': `${clusterName}-${clusterName}`
        },
        pullSecretRef: {
            name: `pullsecret-infraenv-${clusterName}`,
        },
    },
    status: {
        agentLabelSelector: {
            matchLabels: {
                'agentBareMetal-generated-infraenv-ai-flow': `${clusterName}-${clusterName}`
            },
        },
        conditions: [
            {
                lastTransitionTime: '2021-10-04T11:26:37Z',
                message: 'Image has been created',
                reason: 'ImageCreated',
                status: 'True',
                type: 'ImageCreated',
            },
        ],
        debugInfo: {},
        isoDownloadURL: 'https://my.funny.download.url',
    },
}
*/
const useAgentsOfAIFlow = ({ name, namespace }: { name: string; namespace: string }) => {
    const [agents] = useRecoilValue(waitForAll([agentsState]))
    return useMemo(
        () =>
            /* That label is added to the InfraEnv along creating ClusterDeployment, specific for the AI flow */
            agents.filter(
                (agent: CIM.AgentK8sResource) =>
                    agent.metadata?.labels?.[INFRAENV_GENERATED_AI_FLOW] === `${namespace}-${name}`
            ),
        [agents]
    )
}

const useBMHsOfAIFlow = ({ name, namespace }: { name: string; namespace: string }) => {
    const [bmhs] = useRecoilValue(waitForAll([bareMetalAssetsState]))
    return useMemo(
        () =>
            // TODO(mlibra): make that happen!
            /* That label is added to the InfraEnv along creating ClusterDeployment, specific for the AI flow */
            bmhs.filter(
                (bmh: CIM.BareMetalHostK8sResource) =>
                    bmh.metadata?.labels?.[INFRAENV_GENERATED_AI_FLOW] === `${namespace}-${name}`
            ),
        [bmhs]
    )
}

const AIHostsForm: React.FC<AIHostsFormProps> = ({ control, handleChange }) => {
    // -- TODO(mlibra): mock data only, remove
    // console.log('--- control before mocking data: ', control)
    // control.resourceJSON = control.resourceJSON || {}
    // control.resourceJSON.createResources = control.resourceJSON.createResources || [mockCD, mockACI, mockInfraEnv1]
    // -----

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
    const infraEnv = useInfraEnv({ name: cdName, namespace: cdName }) // TODO(mlibra): potential optimization - do not fetch but use from "createResouces"

    const usedHostnames = useMemo(
        () => filteredAgents.map((agent: CIM.AgentK8sResource) => agent.status?.inventory?.hostname),
        [filteredAgents]
    )

    const setErrorHandler = (err: any) => {
        const msg = err instanceof Error ? err?.message : undefined
        setError(msg || 'An error occured')
    }

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
                await onDiscoverHostsNext({ values: control.active || {}, agents: filteredAgents, clusterDeployment })
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

    return clusterDeployment && agentClusterInstall ? (
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
            onApproveAgent={onApproveAgent}
            onDeleteHost={getOnDeleteHost(filteredBMHs)}
            canDeleteAgent={canDeleteAgent}
            onSaveAgent={onSaveAgent}
            onSaveBMH={onSaveBMH}
            onFormSaveError={setErrorHandler}
            fetchSecret={fetchSecret}
            fetchNMState={fetchNMState}
            isBMPlatform={isBMPlatform(infraEnv)}
            getClusterDeploymentLink={getClusterDeploymentLink}
        />
    ) : (
        <LoadingState />
    )
}

export default AIHostsForm

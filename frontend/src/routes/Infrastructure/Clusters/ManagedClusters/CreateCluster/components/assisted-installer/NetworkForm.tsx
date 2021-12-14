/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'
import { FormikProps } from 'formik'
import { debounce, get, isEqual } from 'lodash'
import { NetworkConfigurationValues } from 'openshift-assisted-ui-lib/dist/src/common/types/clusters'
import { patchResource } from '../../../../../../../resources'
import { agentClusterInstallsState, agentsState, clusterDeploymentsState } from '../../../../../../../atoms'
import EditAgentModal from '../../../components/cim/EditAgentModal'

const { ACMClusterDeploymentNetworkingStep, getAgentsHostsNames } = CIM

type FormControl = {
    active?: NetworkConfigurationValues
    agentClusterInstall: CIM.AgentClusterInstallK8sResource
    validate?: () => void
    summary?: () => void
    resourceJSON?: any
    step?: any
}

type NetworkFormProps = {
    control: FormControl
    handleChange: (control: FormControl) => void
}

const fields: any = {
    apiVip: { label: 'API Virtual IP' },
    ingressVip: { label: 'Ingress Virtual IP' },
    clusterNetworkCidr: { label: 'Cluster network CIDR' },
    clusterNetworkHostPrefix: { label: 'Cluster network host prefix' },
    serviceNetworkCidr: { label: 'Service network CIDR' },
    sshPublicKey: { label: 'Host SSH Public Key' },
}

const NetworkForm: React.FC<NetworkFormProps> = ({ control, handleChange }) => {
    const formRef = useRef<FormikProps<NetworkConfigurationValues>>(null)
    useEffect(() => {
        if (control.active) {
            formRef?.current?.setValues(control.active, false)
        } else {
            control.active = formRef?.current?.values
        }
        control.validate = () => {
            return formRef?.current?.submitForm().then(() => {
                return formRef?.current?.errors
            })
        }
        control.summary = () => {
            return Object.keys(fields).map((key) => {
                return {
                    term: fields[key].label,
                    desc: get(control, `active.${key}`),
                    exception: get(control, `errors.${key}`),
                }
            })
        }
    }, [control])

    const [editAgent, setEditAgent] = useState()
    const [agents, clusterDeployments, agentClusterInstalls] = useRecoilValue(
        waitForAll([agentsState, clusterDeploymentsState, agentClusterInstallsState])
    )

    const { resourceJSON = {} } = control
    const { createResources = [] } = resourceJSON
    const cdName = createResources.find((r: { kind: string }) => r.kind === 'ClusterDeployment').metadata.name
    const cdNamespace = createResources.find((r: { kind: string }) => r.kind === 'ClusterDeployment').metadata.namespace
    const aciName = createResources.find((r: { kind: string }) => r.kind === 'AgentClusterInstall').metadata.name
    const aciNamespace = createResources.find((r: { kind: string }) => r.kind === 'AgentClusterInstall').metadata
        .namespace

    const clusterDeployment = useMemo(
        () => clusterDeployments.find(({ metadata }) => metadata.name === cdName && metadata.namespace === cdNamespace),
        [cdName, cdNamespace, clusterDeployments]
    )
    const agentClusterInstall = useMemo(
        () =>
            agentClusterInstalls.find(
                ({ metadata }) => metadata.name === aciName && metadata.namespace === aciNamespace
            ),
        [aciName, aciNamespace, agentClusterInstalls]
    )

    useEffect(() => (control.agentClusterInstall = agentClusterInstall), [control, agentClusterInstall])

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

    const matchingAgents = useMemo(
        () =>
            agents.filter(
                (a) =>
                    a.spec?.clusterDeploymentName?.name === clusterDeployment?.metadata.name &&
                    a.spec?.clusterDeploymentName?.namespace === clusterDeployment?.metadata.namespace
            ),
        [agents, clusterDeployment]
    )

    const usedHostnames = useMemo(() => getAgentsHostsNames(matchingAgents), [matchingAgents])

    const hostActions = useMemo(
        () => ({
            onEditHost: setEditAgent,
            canEditRole: () => true,
            onEditRole: (agent: CIM.AgentK8sResource, role: string | undefined) =>
                patchResource(agent, [
                    {
                        op: 'replace',
                        path: '/spec/role',
                        value: role,
                    },
                ]).promise,
        }),
        [setEditAgent]
    )

    return (
        <>
            <ACMClusterDeploymentNetworkingStep
                formRef={formRef}
                onValuesChanged={onValuesChanged}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={matchingAgents}
                hostActions={hostActions}
            />
            <EditAgentModal agent={editAgent} setAgent={setEditAgent} usedHostnames={usedHostnames} />
        </>
    )
}

export default NetworkForm

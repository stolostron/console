/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from 'react'
import { RouteComponentProps, StaticContext, useHistory } from 'react-router'
import { useRecoilValue, waitForAll } from 'recoil'
import { CIM } from 'openshift-assisted-ui-lib'
import { ClusterDeploymentWizardStepsType } from 'openshift-assisted-ui-lib/cim'
import { PageSection, Switch } from '@patternfly/react-core'
import { AcmErrorBoundary, AcmPageContent, AcmPage, AcmPageHeader } from '@stolostron/ui-components'

import { patchResource } from '../../../../../../resources'
import { agentsState, clusterImageSetsState, configMapsState } from '../../../../../../atoms'
import {
    canEditHost,
    fetchNMState,
    fetchSecret,
    getAIConfigMap,
    getClusterDeploymentLink,
    getOnCreateBMH,
    useOnDeleteHost,
    getOnSaveISOParams,
    onApproveAgent,
    onDiscoveryHostsNext,
    onHostsNext,
    onSaveAgent,
    onSaveBMH,
    onSaveNetworking,
    useBMHsOfAIFlow,
    useClusterDeployment,
    useAgentClusterInstall,
    useInfraEnv,
    useNMStatesOfNamespace,
    fetchInfraEnv,
    fetchManagedClusters,
    fetchKlusterletAddonConfig,
} from '../../CreateCluster/components/assisted-installer/utils'
import EditAgentModal from './EditAgentModal'
import { NavigationPath } from '../../../../../../NavigationPath'
import { BulkActionModel, IBulkActionModelProps } from '../../../../../../components/BulkActionModel'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { isBMPlatform } from '../../../../InfraEnvironments/utils'

const {
    ClusterDeploymentWizard,
    FeatureGateContextProvider,
    ACM_ENABLED_FEATURES,
    LoadingState,
    getAgentsHostsNames,
    isAgentOfInfraEnv,
} = CIM

const TEMPLATE_EDITOR_OPEN_COOKIE = 'template-editor-open-cookie'

type EditAIClusterProps = RouteComponentProps<
    { namespace: string; name: string },
    StaticContext,
    { initialStep?: ClusterDeploymentWizardStepsType }
>

const EditAICluster: React.FC<EditAIClusterProps> = ({
    match: {
        params: { namespace, name },
    },
    location: { state: locationState },
}) => {
    const { t } = useTranslation()
    const [patchingHoldInstallation, setPatchingHoldInstallation] = useState(true)
    const history = useHistory()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
    const [clusterImageSets, agents, configMaps] = useRecoilValue(
        waitForAll([clusterImageSetsState, agentsState, configMapsState])
    )

    const clusterDeployment = useClusterDeployment({ name, namespace })
    const agentClusterInstall = useAgentClusterInstall({ name, namespace })
    const infraEnv = useInfraEnv({ name, namespace })

    // TODO(mlibra): Arn't we missing Bare Metal Hosts in the tables???
    const filteredBMHs = useBMHsOfAIFlow({ name, namespace })

    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<CIM.AgentK8sResource> | { open: false }>(
        { open: false }
    )
    const nmStates = useNMStatesOfNamespace(infraEnv?.metadata?.namespace)
    const onDeleteHost = useOnDeleteHost(setBulkModalProps, filteredBMHs, agentClusterInstall, nmStates)

    const usedHostnames = useMemo(() => getAgentsHostsNames(agents), [agents])

    const aiConfigMap = getAIConfigMap(configMaps)

    const [isPreviewOpen, setPreviewOpen] = useState(!!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE))

    const onSaveDetails = (values: any) => {
        return patchResource(agentClusterInstall, [
            {
                op: 'replace',
                path: '/spec/imageSetRef/name',
                value: values.openshiftVersion,
            },
        ]).promise
    }

    // Specific for the AI flow which has single&dedicated InfraEnv per Cluster
    const agentsOfSingleInfraEnvCluster = useMemo(
        () =>
            agents.filter((a) =>
                // TODO(mlibra): extend here once we can "disable" hosts
                isAgentOfInfraEnv(infraEnv, a)
            ),
        [agents, infraEnv]
    )

    const hostActions = {
        canEditHost: () => true,
        onEditHost: (agent: CIM.AgentK8sResource) => {
            setEditAgent(agent)
        },
        canEditRole: () => true,
        onEditRole: (agent: CIM.AgentK8sResource, role: string | undefined) => {
            return patchResource(agent, [
                {
                    op: 'replace',
                    path: '/spec/role',
                    value: role,
                },
            ]).promise
        },
    }

    useEffect(() => {
        const patch = async () => {
            if (agentClusterInstall) {
                try {
                    if (!agentClusterInstall.spec.holdInstallation) {
                        await patchResource(agentClusterInstall, [
                            {
                                op: agentClusterInstall.spec.holdInstallation === false ? 'replace' : 'add',
                                path: '/spec/holdInstallation',
                                value: true,
                            },
                        ]).promise
                    }
                } finally {
                    setPatchingHoldInstallation(false)
                }
            }
        }
        patch()
    }, [
        // just once but when the ACI is loaded
        !!agentClusterInstall,
    ])

    const onFinish = async () => {
        await patchResource(agentClusterInstall, [
            // effectively, the property gets deleted instead of holding "false" value by that change
            {
                op:
                    agentClusterInstall.spec?.holdInstallation || agentClusterInstall.spec?.holdInstallation === false
                        ? 'replace'
                        : 'add',
                path: '/spec/holdInstallation',
                value: false,
            },
        ]).promise

        history.push(NavigationPath.clusterDetails.replace(':id', agentClusterInstall.metadata.name))
    }

    return patchingHoldInstallation || !clusterDeployment || !agentClusterInstall ? (
        <LoadingState />
    ) : (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    breadcrumb={[
                        { text: t('Clusters'), to: NavigationPath.clusters },
                        {
                            text: clusterDeployment?.metadata?.name,
                            to: NavigationPath.clusterDetails.replace(':id', name as string),
                        },
                        {
                            text: t('managed.ai.editCluster.configurationBreadcrumb'),
                        },
                    ]}
                    title={t('managed.ai.editCluster.title')}
                    switches={
                        <Switch
                            label={`YAML: ${isPreviewOpen ? 'On' : 'Off'}`}
                            isChecked={isPreviewOpen}
                            onChange={(checked) => {
                                setPreviewOpen(checked)
                                if (checked) {
                                    localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
                                } else {
                                    localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
                                }
                            }}
                        />
                    }
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="edit-cluster">
                    <PageSection variant="light" type="wizard" isFilled>
                        <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
                            <BulkActionModel<CIM.AgentK8sResource> {...bulkModalProps} />
                            <ClusterDeploymentWizard
                                className="cluster-deployment-wizard"
                                clusterImages={clusterImageSets}
                                clusterDeployment={clusterDeployment}
                                agentClusterInstall={agentClusterInstall}
                                agents={agents}
                                usedClusterNames={[] /* We are in Edit flow - cluster name can not be changed. */}
                                onClose={history.goBack}
                                onSaveDetails={onSaveDetails}
                                onSaveNetworking={(values) => onSaveNetworking(agentClusterInstall, values)}
                                onSaveHostsSelection={(values) =>
                                    onHostsNext({ values, clusterDeployment, agents, agentClusterInstall })
                                }
                                onApproveAgent={onApproveAgent}
                                onDeleteHost={onDeleteHost as any}
                                canDeleteAgent={(agent?: CIM.AgentK8sResource, bmh?: CIM.BareMetalHostK8sResource) =>
                                    !!nmStates && (!!agent || !!bmh)
                                }
                                onSaveAgent={onSaveAgent}
                                canEditHost={canEditHost}
                                onSaveBMH={onSaveBMH}
                                onCreateBMH={getOnCreateBMH(infraEnv) /* AI Flow specific. Not called for CIM. */}
                                onSaveISOParams={
                                    getOnSaveISOParams(infraEnv) /* AI Flow specific. Not called for CIM. */
                                }
                                // onFormSaveError={setErrorHandler}
                                onSaveHostsDiscovery={(values) =>
                                    onDiscoveryHostsNext({
                                        values,
                                        clusterDeployment,
                                        agents: agentsOfSingleInfraEnvCluster,
                                        agentClusterInstall,
                                    })
                                }
                                fetchSecret={fetchSecret}
                                fetchNMState={fetchNMState}
                                getClusterDeploymentLink={getClusterDeploymentLink}
                                hostActions={hostActions}
                                onFinish={onFinish}
                                aiConfigMap={aiConfigMap}
                                infraEnv={infraEnv}
                                initialStep={locationState?.initialStep}
                                fetchInfraEnv={fetchInfraEnv}
                                isBMPlatform={isBMPlatform(infraEnv)}
                                isPreviewOpen={isPreviewOpen}
                                setPreviewOpen={setPreviewOpen}
                                fetchManagedClusters={fetchManagedClusters}
                                fetchKlusterletAddonConfig={fetchKlusterletAddonConfig}
                            />
                            <EditAgentModal agent={editAgent} setAgent={setEditAgent} usedHostnames={usedHostnames} />
                        </FeatureGateContextProvider>
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export default EditAICluster

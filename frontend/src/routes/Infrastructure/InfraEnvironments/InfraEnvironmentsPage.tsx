/* Copyright Contributors to the Open Cluster Management project */
import {
    Button,
    ButtonVariant,
    Flex,
    FlexItem,
    PageSection,
    Popover,
    Stack,
    StackItem,
    TextContent,
} from '@patternfly/react-core'
import { CogIcon, InfoCircleIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300'
import {
    AcmButton,
    AcmEmptyState,
    AcmInlineStatusGroup,
    AcmLabels,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmTable,
    compareStrings,
} from '../../../ui-components'
import isMatch from 'lodash/isMatch'
import {
    AgentK8sResource,
    InfraEnvK8sResource,
    AGENT_LOCATION_LABEL_KEY,
    getAgentStatus,
    isCIMConfigured,
    isStorageConfigured,
    CimConfigurationModal,
    AgentServiceConfigK8sResource,
    CimStorageMissingAlert,
    CimConfigProgressAlert,
    getCurrentClusterVersion,
    getMajorMinorVersion,
    CreateResourceFuncType,
    GetResourceFuncType,
    ListResourcesFuncType,
    PatchResourceFuncType,
} from 'openshift-assisted-ui-lib/cim'
import { useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { deleteResources } from '../../../lib/delete-resources'
import { DOC_LINKS, OCP_DOC_BASE_PATH, viewDocumentation } from '../../../lib/doc-util'
import { rbacDelete } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import { getDateTimeCell } from '../helpers/table-row-helpers'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../shared-recoil'
import { IResource } from '../../../resources/resource'
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { createResource, getResource, listResources, patchResource } from '../../../resources'

// Will change perspective, still in the OCP Console app
const storageOperatorUrl = '/operatorhub/ns/multicluster-engine?category=Storage'
const assistedServiceDeploymentUrl = '/k8s/ns/multicluster-engine/deployments/assisted-service'

const isDeleteDisabled = (infraEnvs: InfraEnvK8sResource[], agents: AgentK8sResource[]) => {
    let isDisabled = true
    infraEnvs.forEach((infraEnv) => {
        const infraAgents = agents.filter((a) =>
            isMatch(a.metadata?.labels || {}, infraEnv.status?.agentLabelSelector?.matchLabels || {})
        )
        if (infraAgents.length == 0) isDisabled = false
    })
    return isDisabled
}

const deleteInfraEnv = (
    infraEnv: InfraEnvK8sResource,
    infraEnvs: InfraEnvK8sResource[],
    agents: AgentK8sResource[]
) => {
    //1st: We prevent deleting action if there are any agents assigned to infraenv
    const infraAgents = agents.filter((a) =>
        isMatch(a.metadata?.labels || {}, infraEnv.status?.agentLabelSelector?.matchLabels || {})
    )
    const resources = [infraEnv]
    // Check all infraenv with same pull secret. If we don't found more infraenv we delete pull secret.
    const pullSecrets = infraEnvs.filter((a) =>
        isMatch(a.spec?.pullSecretRef || {}, infraEnv.spec?.pullSecretRef || {})
    )
    if (pullSecrets.length == 1) {
        if (infraEnv.spec?.pullSecretRef?.name && infraAgents.length == 0) {
            resources.push({
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    name: infraEnv.spec.pullSecretRef.name,
                    namespace: infraEnv.metadata?.namespace,
                },
            })
        }
    }
    const deleteResourcesResult = deleteResources(resources as IResource[])

    return {
        promise: new Promise((resolve, reject) => {
            deleteResourcesResult.promise.then((promisesSettledResult) => {
                if (promisesSettledResult[0]?.status === 'rejected') {
                    const error = promisesSettledResult[0].reason
                    if (error) {
                        reject(promisesSettledResult[0].reason)
                        return
                    }
                }
                if (promisesSettledResult[1]?.status === 'rejected') {
                    reject(promisesSettledResult[1].reason)
                    return
                }
                resolve(promisesSettledResult)
            })
        }),
        abort: deleteResourcesResult.abort,
    }
}

const k8sPrimitives: {
    createResource: CreateResourceFuncType
    getResource: GetResourceFuncType
    listResources: ListResourcesFuncType
    patchResource: PatchResourceFuncType
} = {
    createResource: (res) => createResource(res).promise,
    getResource: (res) => getResource(res).promise,
    listResources: (...params) => listResources(...params).promise,
    patchResource: (...params) => patchResource(...params).promise,
}

const InfraEnvironmentsPage: React.FC = () => {
    const { agentsState, infraEnvironmentsState, infrastructuresState, agentServiceConfigsState, storageClassState } =
        useSharedAtoms()
    const { waitForAll } = useSharedRecoil()
    const [infraEnvs, agents, infrastructures, agentServiceConfigs, storageClasses] = useRecoilValue(
        waitForAll([
            infraEnvironmentsState,
            agentsState,
            infrastructuresState,
            agentServiceConfigsState,
            storageClassState,
        ])
    )

    const [isCimConfigurationModalOpen, setIsCimConfigurationModalOpen] = useState(false)
    const { t } = useTranslation()

    const platform: string = infrastructures?.[0]?.status?.platform || 'None'
    const agentServiceConfig = agentServiceConfigs?.[0]
    const isStorage = isStorageConfigured({ storageClasses: storageClasses as K8sResourceCommon[] | undefined })

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('Host inventory')}
                    description={
                        <>
                            <span>
                                {t('{{hostCount}} hosts in {{infraEnvCount}} infrastructure environment', {
                                    hostCount: agents.length,
                                    infraEnvCount: infraEnvs.length,
                                })}
                            </span>
                            <Popover
                                bodyContent={t(
                                    'An infrastructure environment manages your hosts and creates clusters that share network, proxy, and location settings.'
                                )}
                            >
                                <Button isInline variant="plain" icon={<OutlinedQuestionCircleIcon />} />
                            </Popover>
                        </>
                    }
                    actions={
                        <Button
                            isDisabled={!isStorage}
                            variant={ButtonVariant.link}
                            onClick={() => setIsCimConfigurationModalOpen(true)}
                        >
                            <CogIcon />
                            &nbsp;{t('Configure host inventory settings')}
                        </Button>
                    }
                />
            }
        >
            <AcmPageContent id="infra-environments">
                <PageSection>
                    <InfraEnvsTable
                        infraEnvs={infraEnvs}
                        agents={agents}
                        agentServiceConfig={agentServiceConfig}
                        isStorage={isStorage}
                    />
                </PageSection>
            </AcmPageContent>

            {isCimConfigurationModalOpen && (
                <CimConfigurationModal
                    {...k8sPrimitives}
                    isOpen
                    onClose={() => setIsCimConfigurationModalOpen(false)}
                    agentServiceConfig={agentServiceConfig}
                    platform={platform}
                    docDisconnectedUrl={DOC_LINKS.CIM_CONFIG_DISONNECTED}
                    docConfigUrl={DOC_LINKS.CIM_CONFIG}
                    docConfigAwsUrl={DOC_LINKS.CIM_CONFIG_AWS}
                />
            )}
        </AcmPage>
    )
}

const keyFn = (infraEnv: InfraEnvK8sResource) => infraEnv.metadata?.uid!

type InfraEnvsTableProps = {
    infraEnvs: InfraEnvK8sResource[]
    agents: AgentK8sResource[]
    agentServiceConfig?: AgentServiceConfigK8sResource
    isStorage: boolean
}

const InfraEnvsTable: React.FC<InfraEnvsTableProps> = ({ infraEnvs, agents, agentServiceConfig, isStorage }) => {
    const { t } = useTranslation()
    const history = useHistory()
    const getDetailsLink = (infraEnv: InfraEnvK8sResource) =>
        NavigationPath.infraEnvironmentDetails
            .replace(':namespace', infraEnv.metadata?.namespace as string)
            .replace(':name', infraEnv.metadata?.name as string)

    const { clusterVersionState } = useSharedAtoms()
    const { waitForAll } = useSharedRecoil()
    const [clusterVersions] = useRecoilValue(waitForAll([clusterVersionState]))

    const [modalProps, setModalProps] = useState<IBulkActionModelProps<InfraEnvK8sResource> | { open: false }>({
        open: false,
    })

    const infraAgentsFiltered: {
        [key: string]: {
            infraAgents: AgentK8sResource[]
            errorAgents: AgentK8sResource[]
            warningAgents: AgentK8sResource[]
        }
    } = {}

    infraEnvs.forEach((infraEnv) => {
        const infraAgents = agents.filter((a) =>
            isMatch(a.metadata?.labels || {}, infraEnv.status?.agentLabelSelector?.matchLabels || {})
        )
        const errorAgents = infraAgents.filter((a) => getAgentStatus(a).status.key === 'error')
        const warningAgents = infraAgents.filter((a) =>
            [
                'pending-for-input',
                'insufficient',
                'insufficient-unbound',
                'disconnected-unbound',
                'disconnected',
            ].includes(getAgentStatus(a).status.key)
        )

        infraAgentsFiltered[infraEnv.metadata?.uid!] = {
            infraAgents,
            errorAgents,
            warningAgents,
        }
    })

    const onClickBulkDeleteInfraEnvs = (infraEnvs: InfraEnvK8sResource[]) => {
        setModalProps({
            open: true,
            title: t('bulk.title.delete.infraenv'),
            action: t('delete'),
            processing: t('deleting'),
            resources: infraEnvs,
            description: t('bulk.message.delete.infraenv'),
            columns: [
                {
                    header: t('infraEnv.tableHeader.name'),
                    cell: 'metadata.name',
                    sort: 'metadata.name',
                },
                {
                    header: t('infraEnv.tableHeader.hosts'),
                    cell: (infraEnv) => {
                        const { infraAgents, errorAgents, warningAgents } = infraAgentsFiltered[infraEnv.metadata?.uid!]

                        const HostsStatusGroupCell = (
                            <Link to={`${getDetailsLink(infraEnv)}/hosts`}>
                                {infraAgents.length ? (
                                    <AcmInlineStatusGroup
                                        healthy={infraAgents.length - errorAgents.length - warningAgents.length}
                                        danger={errorAgents.length}
                                        warning={warningAgents.length}
                                    />
                                ) : (
                                    0
                                )}
                            </Link>
                        )

                        return infraAgents.length ? (
                            <Flex>
                                <FlexItem>{HostsStatusGroupCell}</FlexItem>
                                <FlexItem align={{ default: 'alignRight' }}>
                                    <Popover
                                        aria-label="Infraenv cannot be deleted popover"
                                        headerContent={<div>Cannot be deleted</div>}
                                        bodyContent={<div>{t('infraEnv.rowAction.delete.desc')}</div>}
                                    >
                                        <Button variant="link" icon={<InfoCircleIcon color={blueInfoColor.value} />}>
                                            Cannot be deleted
                                        </Button>
                                    </Popover>
                                </FlexItem>
                            </Flex>
                        ) : (
                            HostsStatusGroupCell
                        )
                    },
                },
            ],
            keyFn: (infraEnv: InfraEnvK8sResource) => infraEnv.metadata?.uid!,
            actionFn: (infraEnv: InfraEnvK8sResource) => {
                const { infraAgents } = infraAgentsFiltered[infraEnv.metadata?.uid!]
                if (infraAgents.length) {
                    return {
                        promise: Promise.resolve(),
                        abort: () => {},
                    }
                }

                return deleteInfraEnv(infraEnv, infraEnvs, agents)
            },
            close: () => {
                setModalProps({ open: false })
            },
            isDanger: true,
            icon: 'warning',
            confirmText: t('confirm').toLowerCase(),
            disableSubmitButton: isDeleteDisabled(infraEnvs, agents),
        })
    }

    const clusterVersion = clusterVersions?.[0]
    const isCIMWorking = isStorage && isCIMConfigured({ agentServiceConfig })

    const ocpVersion = getMajorMinorVersion(getCurrentClusterVersion(clusterVersion)) || 'latest'
    const docStorageUrl = `${OCP_DOC_BASE_PATH}/${ocpVersion}/post_installation_configuration/storage-configuration.html`

    return (
        <>
            <BulkActionModel<InfraEnvK8sResource> {...modalProps} />
            <Stack hasGutter>
                {!isStorage && (
                    <CimStorageMissingAlert docStorageUrl={docStorageUrl} storageOperatorUrl={storageOperatorUrl} />
                )}
                {isStorage && (
                    <CimConfigProgressAlert
                        agentServiceConfig={agentServiceConfig}
                        assistedServiceDeploymentUrl={assistedServiceDeploymentUrl}
                    />
                )}
                <StackItem>
                    <AcmTable<InfraEnvK8sResource>
                        items={infraEnvs}
                        rowActions={[]}
                        keyFn={keyFn}
                        plural="infra environments"
                        columns={[
                            {
                                header: t('infraEnv.tableHeader.name'),
                                sort: 'metadata.name',
                                search: 'metadata.name',
                                cell: (infraEnv) => (
                                    <span style={{ whiteSpace: 'nowrap' }}>
                                        <Link to={getDetailsLink(infraEnv)}>{infraEnv.metadata?.name}</Link>
                                    </span>
                                ),
                            },
                            {
                                header: t('infraEnv.tableHeader.namespace'),
                                cell: 'metadata.namespace',
                                search: 'metadata.namespace',
                            },
                            {
                                header: t('infraEnv.tableHeader.labels'),
                                cell: (infraEnv) => {
                                    if (infraEnv.metadata?.labels) {
                                        const labelKeys = Object.keys(infraEnv.metadata.labels)
                                        const collapse =
                                            [
                                                'cloud',
                                                'clusterID',
                                                'installer.name',
                                                'installer.namespace',
                                                'name',
                                                'vendor',
                                                'managed-by',
                                                'local-cluster',
                                            ].filter((label) => labelKeys.includes(label)) ?? []
                                        return (
                                            <AcmLabels
                                                labels={infraEnv.metadata.labels}
                                                expandedText={t('show.less')}
                                                collapsedText={t('show.more', { number: collapse.length })}
                                                collapse={collapse}
                                            />
                                        )
                                    } else {
                                        return '-'
                                    }
                                },
                                search: (infraEnv) => JSON.stringify(infraEnv.metadata?.labels) || '',
                            },
                            {
                                header: t('infraEnv.tableHeader.location'),
                                cell: (infraEnv) => infraEnv.metadata?.labels?.[AGENT_LOCATION_LABEL_KEY] ?? '-',
                            },
                            {
                                header: t('infraEnv.tableHeader.hosts'),
                                cell: (infraEnv) => {
                                    const { infraAgents, errorAgents, warningAgents } =
                                        infraAgentsFiltered[infraEnv.metadata?.uid!]

                                    return (
                                        <Link to={`${getDetailsLink(infraEnv)}/hosts`}>
                                            {infraAgents.length ? (
                                                <AcmInlineStatusGroup
                                                    healthy={
                                                        infraAgents.length - errorAgents.length - warningAgents.length
                                                    }
                                                    danger={errorAgents.length}
                                                    warning={warningAgents.length}
                                                />
                                            ) : (
                                                0
                                            )}
                                        </Link>
                                    )
                                },
                            },
                            {
                                header: t('infraEnv.tableHeader.creationDate'),
                                sort: (a: InfraEnvK8sResource, b: InfraEnvK8sResource) => {
                                    const dateTimeCellA = getDateTimeCell(
                                        a.metadata?.creationTimestamp
                                            ? new Date(a.metadata?.creationTimestamp).toString()
                                            : '-'
                                    )
                                    const dateTimeCellB = getDateTimeCell(
                                        b.metadata?.creationTimestamp
                                            ? new Date(b.metadata?.creationTimestamp).toString()
                                            : '-'
                                    )
                                    return compareStrings(
                                        dateTimeCellA.sortableValue == 0 ? '' : dateTimeCellA.sortableValue.toString(),
                                        dateTimeCellB.sortableValue == 0 ? '' : dateTimeCellB.sortableValue.toString()
                                    )
                                },
                                cell: (infraEnv) => {
                                    const dateTimeCell = getDateTimeCell(
                                        infraEnv.metadata?.creationTimestamp
                                            ? new Date(infraEnv.metadata?.creationTimestamp).toString()
                                            : '-'
                                    )
                                    return dateTimeCell.title === 'Invalid Date' ? '-' : dateTimeCell.title
                                },
                            },
                            {
                                header: '',
                                cellTransforms: [fitContent],
                                cell: (infraEnv) => {
                                    const { infraAgents } = infraAgentsFiltered[infraEnv.metadata?.uid!]

                                    const actions = []
                                    if (infraAgents.length > 0) {
                                        actions.push({
                                            id: 'delete',
                                            text: t('infraEnv.rowAction.delete.title'),
                                            description: t('infraEnv.rowAction.delete.desc'),
                                            isDisabled: true,
                                            isAriaDisabled: true,
                                            click: () => {},
                                        })
                                    } else {
                                        actions.push({
                                            id: 'delete',
                                            text: t('infraEnv.rowAction.delete.title'),
                                            isAriaDisabled: true,
                                            click: (infraEnv: InfraEnvK8sResource) => {
                                                setModalProps({
                                                    open: true,
                                                    title: t('action.title.delete'),
                                                    action: t('delete'),
                                                    processing: t('deleting'),
                                                    resources: [infraEnv],
                                                    description: t('action.message.delete'),
                                                    columns: [
                                                        {
                                                            header: t('infraEnv.tableHeader.name'),
                                                            cell: 'metadata.name',
                                                            sort: 'metadata.name',
                                                        },
                                                        {
                                                            header: t('infraEnv.tableHeader.namespace'),
                                                            cell: 'metadata.namespace',
                                                            sort: 'metadata.namespace',
                                                        },
                                                    ],
                                                    keyFn: (infraEnv: InfraEnvK8sResource) => infraEnv.metadata?.uid!,
                                                    actionFn: (infraEnv: InfraEnvK8sResource) => {
                                                        return deleteInfraEnv(infraEnv, infraEnvs, agents)
                                                    },
                                                    close: () => {
                                                        setModalProps({ open: false })
                                                    },
                                                    isDanger: true,
                                                    icon: 'warning',
                                                })
                                            },
                                            rbac: [rbacDelete(infraEnv as IResource)],
                                        })
                                    }

                                    return (
                                        <RbacDropdown<InfraEnvK8sResource>
                                            id={`${infraEnv?.metadata?.name!}-actions`}
                                            item={infraEnv}
                                            isKebab={true}
                                            text={`${infraEnv?.metadata?.name!}-actions`}
                                            actions={actions}
                                        />
                                    )
                                },
                            },
                        ]}
                        tableActionButtons={[
                            {
                                id: 'createInfraEnv',
                                title: t('infraEnv.bulkAction.createInfraEnv'),
                                click: () => history.push(NavigationPath.createInfraEnv),
                                variant: ButtonVariant.primary,
                            },
                        ]}
                        tableActions={[
                            {
                                id: 'delete',
                                title: t('infraEnv.delete.plural'),
                                click: onClickBulkDeleteInfraEnvs,
                                variant: 'bulk-action',
                            },
                        ]}
                        emptyState={
                            <AcmEmptyState
                                key="ieEmptyState"
                                title={t("Let's create your first infrastructure environment")}
                                message={t(
                                    'Managing hosts with infrastructure environments makes it easy to set settings across multiple hosts.'
                                )}
                                action={
                                    <div>
                                        <AcmButton
                                            variant="primary"
                                            onClick={() => {
                                                history.push(NavigationPath.createInfraEnv)
                                            }}
                                            isDisabled={!isCIMWorking}
                                            tooltip={
                                                !isCIMWorking ? (
                                                    <>
                                                        {t(
                                                            'To create an infrastructure environment, you must configure the host inventory settings.'
                                                        )}
                                                    </>
                                                ) : undefined
                                            }
                                        >
                                            {t('Create infrastructure environment')}
                                        </AcmButton>
                                        <TextContent>
                                            {viewDocumentation(DOC_LINKS.INFRASTRUCTURE_EVIRONMENTS, t)}
                                        </TextContent>
                                    </div>
                                }
                            />
                        }
                    />
                </StackItem>
            </Stack>
        </>
    )
}

export default InfraEnvironmentsPage

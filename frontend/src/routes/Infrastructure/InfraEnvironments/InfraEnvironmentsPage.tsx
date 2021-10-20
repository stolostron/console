/* Copyright Contributors to the Open Cluster Management project */
import {
    AcmButton,
    AcmEmptyState,
    AcmInlineStatusGroup,
    AcmLabels,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmRoute,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { ButtonVariant, PageSection } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import isMatch from 'lodash/isMatch'
import { CIM } from 'openshift-assisted-ui-lib'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import { acmRouteState, agentsState, infraEnvironmentsState } from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { RbacDropdown } from '../../../components/Rbac'
import { deleteResources } from '../../../lib/delete-resources'
import { rbacDelete } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import { OnPremiseBanner } from '../Clusters/ManagedClusters/components/cim/OnPremiseBanner'

const { AGENT_LOCATION_LABEL_KEY, getAgentStatus } = CIM

const deleteInfraEnv = (infraEnv: CIM.InfraEnvK8sResource) => {
    const resources = [infraEnv]
    if (infraEnv.spec?.pullSecretRef?.name) {
        resources.push({
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: infraEnv.spec.pullSecretRef.name,
                namespace: infraEnv.metadata.namespace,
            },
        })
    }
    return deleteResources(resources)
}

const InfraEnvironmentsPage: React.FC = () => {
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.InfraEnvironments), [setRoute])

    const [infraEnvs, agents] = useRecoilValue(waitForAll([infraEnvironmentsState, agentsState]))
    const { t } = useTranslation(['infraenv', 'common'])

    return (
        <AcmPage hasDrawer header={<AcmPageHeader title={t('infraenv:infraenvs')} />}>
            <AcmPageContent id="infra-environments">
                <OnPremiseBanner
                    id="banner.infraenv"
                    WrappingComponent={PageSection}
                    titleKey="cim:cim.infra.banner.header"
                    textKey="cim:cim.infra.banner.body"
                />

                <PageSection>
                    <InfraEnvsTable infraEnvs={infraEnvs} agents={agents} />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

const keyFn = (infraEnv: CIM.InfraEnvK8sResource) => infraEnv.metadata.uid

type InfraEnvsTableProps = {
    infraEnvs: CIM.InfraEnvK8sResource[]
    agents: CIM.AgentK8sResource[]
}

const InfraEnvsTable: React.FC<InfraEnvsTableProps> = ({ infraEnvs, agents }) => {
    const { t } = useTranslation(['infraenv', 'common'])
    const history = useHistory()
    const getDetailsLink = (infraEnv: CIM.InfraEnvK8sResource) =>
        NavigationPath.infraEnvironmentDetails
            .replace(':namespace', infraEnv.metadata.namespace as string)
            .replace(':name', infraEnv.metadata.name as string)

    const [modalProps, setModalProps] = useState<IBulkActionModelProps<CIM.InfraEnvK8sResource> | { open: false }>({
        open: false,
    })

    return (
        <>
            <BulkActionModel<CIM.InfraEnvK8sResource> {...modalProps} />
            <AcmTable<CIM.InfraEnvK8sResource>
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
                                <Link to={getDetailsLink(infraEnv)}>{infraEnv.metadata.name}</Link>
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
                            if (infraEnv.metadata.labels) {
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
                                        expandedText={t('common:show.less')}
                                        collapsedText={t('common:show.more', { number: collapse.length })}
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
                            const infraAgents = agents.filter((a) =>
                                isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels)
                            )
                            const errorAgents = infraAgents.filter((a) => getAgentStatus(a)[0] === 'error')
                            const warningAgents = infraAgents.filter((a) => getAgentStatus(a)[0] === 'insufficient')

                            return (
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
                        },
                    },
                    {
                        header: '',
                        cellTransforms: [fitContent],
                        cell: (infraEnv) => {
                            const actions = [
                                {
                                    id: 'delete',
                                    text: t('infraEnv.rowAction.delete.title'),
                                    isDisabled: true,
                                    click: (infraEnv: CIM.InfraEnvK8sResource) => {
                                        setModalProps({
                                            open: true,
                                            title: t('action.title.delete'),
                                            action: t('common:delete'),
                                            processing: t('common:deleting'),
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
                                            keyFn: (infraEnv: CIM.InfraEnvK8sResource) =>
                                                infraEnv.metadata.uid as string,
                                            actionFn: deleteInfraEnv,
                                            close: () => {
                                                setModalProps({ open: false })
                                            },
                                            isDanger: true,
                                            icon: 'warning',
                                        })
                                    },
                                    rbac: [rbacDelete(infraEnv)],
                                },
                            ]

                            return (
                                <RbacDropdown<CIM.InfraEnvK8sResource>
                                    id={`${infraEnv.metadata.name}-actions`}
                                    item={infraEnv}
                                    isKebab={true}
                                    text={`${infraEnv.metadata.name}-actions`}
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
                        click: (infraEnvs: CIM.InfraEnvK8sResource[]) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.delete'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: infraEnvs,
                                description: t('bulk.message.delete'),
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
                                keyFn: (infraEnv: CIM.InfraEnvK8sResource) => infraEnv.metadata.uid as string,
                                actionFn: deleteInfraEnv,
                                close: () => {
                                    setModalProps({ open: false })
                                },
                                isDanger: true,
                                icon: 'warning',
                            })
                        },
                        variant: 'bulk-action',
                    },
                ]}
                emptyState={
                    <AcmEmptyState
                        key="ieEmptyState"
                        title={t('infraEnv.emptyStateHeader')}
                        action={
                            <AcmButton component={Link} variant="primary" to={NavigationPath.createInfraEnv}>
                                {t('infraEnv.createCluster')}
                            </AcmButton>
                        }
                    />
                }
            />
        </>
    )
}

export default InfraEnvironmentsPage

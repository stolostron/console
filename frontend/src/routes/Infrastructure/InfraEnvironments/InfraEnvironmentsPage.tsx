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
    const { t } = useTranslation()

    return (
        <AcmPage hasDrawer header={<AcmPageHeader title={t('Infrastructure environments')} />}>
            <AcmPageContent id="infra-environments">
                <OnPremiseBanner
                    id="banner.infraenv"
                    WrappingComponent={PageSection}
                    titleKey="A pool of hosts, ready for cluster creation"
                    textKey="Provision hosts for cluster creation. Create new or select existing Infrastructure Environment, once completed, click on the “Add hosts” to discover, provision and add hosts to it."
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
    const { t } = useTranslation()
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
                        header: t('Name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (infraEnv) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link to={getDetailsLink(infraEnv)}>{infraEnv.metadata.name}</Link>
                            </span>
                        ),
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        search: 'metadata.namespace',
                    },
                    {
                        header: t('Labels'),
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
                                        expandedText={t('Show less')}
                                        // TODO - Handle interpolation
                                        collapsedText={t('{{number}} more', { number: collapse.length })}
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
                        header: t('Location'),
                        cell: (infraEnv) => infraEnv.metadata?.labels?.[AGENT_LOCATION_LABEL_KEY] ?? '-',
                    },
                    {
                        header: t('Hosts available'),
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
                                    text: t('Delete infrastructure environment'),
                                    isDisabled: true,
                                    click: (infraEnv: CIM.InfraEnvK8sResource) => {
                                        setModalProps({
                                            open: true,
                                            title: t('Delete infrastructure environment?'),
                                            action: t('Delete'),
                                            processing: t('Deleting'),
                                            resources: [infraEnv],
                                            description: t(
                                                'You are about to delete infrastructure environment. The infrastructure environment will no longer be available.'
                                            ),
                                            columns: [
                                                {
                                                    header: t('Name'),
                                                    cell: 'metadata.name',
                                                    sort: 'metadata.name',
                                                },
                                                {
                                                    header: t('Namespace'),
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
                        title: t('Create infrastructure environment'),
                        click: () => history.push(NavigationPath.createInfraEnv),
                        variant: ButtonVariant.primary,
                    },
                ]}
                tableActions={[
                    {
                        id: 'delete',
                        title: t('Delete infrastructure environments'),
                        click: (infraEnvs: CIM.InfraEnvK8sResource[]) => {
                            setModalProps({
                                open: true,
                                title: t('Delete infrastructure environments?'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                resources: infraEnvs,
                                description: t(
                                    'You are about to delete infrastructure environments. The infrastructure environments will no longer be available.'
                                ),
                                columns: [
                                    {
                                        header: t('Name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('Namespace'),
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
                        title={t("You don't have any infrastructure environments.")}
                        action={
                            <AcmButton component={Link} variant="primary" to={NavigationPath.createInfraEnv}>
                                {t('Create infrastructure environment')}
                            </AcmButton>
                        }
                    />
                }
            />
        </>
    )
}

export default InfraEnvironmentsPage

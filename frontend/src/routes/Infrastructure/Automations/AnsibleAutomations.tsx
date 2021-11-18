/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    ClusterCurator,
    deleteResource,
    filterForTemplatedCurators,
    getTemplateJobsNum,
    LinkAnsibleCredential,
    unpackProviderConnection,
} from '../../../resources'
import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmRoute,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { ButtonVariant, Hint, PageSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, clusterCuratorsState, configMapsState, secretsState } from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { DropdownActionModal, IDropdownActionModalProps } from '../../../components/DropdownActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { rbacDelete, rbacPatch } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'

export default function AnsibleAutomationsPage() {
    const [, setRoute] = useRecoilState(acmRouteState)
    const [configMaps] = useRecoilState(configMapsState)
    useEffect(() => setRoute(AcmRoute.Automation), [setRoute])

    const alertContext = useContext(AcmAlertContext)
    useEffect(() => alertContext.clearAlerts, [])
    const { t } = useTranslation()

    const useStyles = makeStyles({
        hint: {
            marginBottom: '16px',
        },
    })
    const classes = useStyles()

    // function launchToOperatorInstall() {

    //     if (openShiftConsoleUrl) {
    //         const response = getHivePod(cluster.namespace!, cluster.name!, cluster.status!)
    //         response.then((job) => {
    //             const podName = job?.metadata.name
    //             podName &&
    //                 window.open(`${openShiftConsoleUrl}/k8s/ns/${cluster.namespace!}/pods/${podName}/logs?container=hive`)
    //         })
    //     }
    // }

    const openShiftConsoleConfig = configMaps.find((configmap) => configmap.metadata.name === 'console-public')
    const openShiftConsoleUrl = openShiftConsoleConfig?.data?.consoleURL

    return (
        <AcmPage hasDrawer header={<AcmPageHeader title={t('Automation')} />}>
            <AcmPageContent id="clusters">
                <PageSection>
                    <Hint className={classes.hint}>
                        <div>
                            {t('cluster:template.hint')}{' '}
                            <AcmButton
                                onClick={() =>
                                    window.open(
                                        openShiftConsoleUrl +
                                            '/operatorhub/all-namespaces?keyword=ansible+automation+platform'
                                    )
                                }
                                variant={ButtonVariant.link}
                                role="link"
                                id="view-logs"
                                isInline
                                isSmall
                            >
                                {t('OperatorHub')}
                                <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                            </AcmButton>
                        </div>
                    </Hint>
                    <AnsibleJobTemplateTable />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

function AnsibleJobTemplateTable() {
    // Load Data
    const [secrets] = useRecoilState(secretsState)
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const templatedCurators = useMemo(() => filterForTemplatedCurators(clusterCurators), [clusterCurators])
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )

    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<ClusterCurator> | { open: false }>({
        open: false,
    })

    const [dropdownModalProps, setDropdownModalProps] = useState<
        IDropdownActionModalProps<ClusterCurator> | { open: false }
    >({
        open: false,
    })
    const { t } = useTranslation()

    const history = useHistory()

    // Set table
    return (
        <Fragment>
            <BulkActionModel<ClusterCurator> {...bulkModalProps} />
            <DropdownActionModal<ClusterCurator> {...dropdownModalProps} />
            <AcmTable<ClusterCurator>
                plural="templates"
                items={templatedCurators}
                columns={[
                    {
                        header: t('Name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (curator) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link
                                    to={NavigationPath.editAnsibleAutomation
                                        .replace(':namespace', curator.metadata.namespace!)
                                        .replace(':name', curator.metadata.name!)}
                                >
                                    {curator.metadata.name!}
                                </Link>
                            </span>
                        ),
                    },
                    {
                        header: t('Credential'),
                        cell: (clusterCurator) => {
                            if (clusterCurator.spec?.install?.towerAuthSecret === undefined) {
                                //Connect to Modal
                                return (
                                    <AcmButton
                                        isInline
                                        variant="link"
                                        isSmall
                                        tooltip={
                                            <Trans
                                                i18nKey="You don't have any Ansible credentials. Visit the <bold>Credentials</bold> tab and select <bold>Add credential</bold> to create an Ansible credential."
                                                components={{ bold: <strong /> }}
                                            />
                                        }
                                        isDisabled={ansibleCredentials.length === 0}
                                        onClick={() => {
                                            setDropdownModalProps({
                                                open: true,
                                                title: t('Link an Ansible connection'),
                                                action: t('Link'),
                                                processing: t('Linking'),
                                                resource: clusterCurator,
                                                description: t(
                                                    'Linking an Ansible connection will allow you to run job templates for cluster lifecycle actions when you create a cluster with this template.'
                                                ),
                                                actionFn: LinkAnsibleCredential,
                                                close: () => setDropdownModalProps({ open: false }),
                                                isDanger: false,
                                                selectOptions: ansibleCredentials.map(
                                                    (credential) => credential.metadata.name as string
                                                ),
                                                selectLabel: t('Ansible connection'),
                                                selectPlaceholder: t('Select an Ansible connection'),
                                                confirmText: 'Link',
                                            })
                                        }}
                                    >
                                        {t('Link a credential')}
                                    </AcmButton>
                                )
                            } else return clusterCurator.spec.install.towerAuthSecret
                        },
                    },
                    {
                        header: t('Job templates'),
                        cell: (clusterCurator) => {
                            return getTemplateJobsNum(clusterCurator)
                        },
                    },
                    {
                        header: '',
                        cellTransforms: [fitContent],
                        cell: (curator: ClusterCurator) => {
                            const actions = [
                                {
                                    id: 'edit-template',
                                    text: t('Edit template'),
                                    isDisabled: true,
                                    rbac: [rbacPatch(curator)],
                                    click: (curator: ClusterCurator) => {
                                        history.push(
                                            NavigationPath.editAnsibleAutomation
                                                .replace(':namespace', curator.metadata.namespace!)
                                                .replace(':name', curator.metadata.name!)
                                        )
                                    },
                                },
                                {
                                    id: 'delete',
                                    text: t('Delete'),
                                    isDisabled: true,
                                    rbac: [rbacDelete(curator)],
                                    click: (curator: ClusterCurator) => {
                                        setBulkModalProps({
                                            open: true,
                                            title: t('Delete template'),
                                            action: t('Delete'),
                                            processing: t('Deleting'),
                                            resources: [curator],
                                            description: curator.spec?.install?.towerAuthSecret ? (
                                                <div>
                                                    <Trans
                                                        // TODO - handle interpolation
                                                        i18nKey="This action will delete your Ansible job template. Are you sure you want to unlink <bold>{{curatorTemplate}}</bold> from <bold>{{ansibleCredential}}</bold>?"
                                                        values={{
                                                            curatorTemplate: curator.metadata.name as string,
                                                            ansibleCredential: curator.spec.install
                                                                .towerAuthSecret as string,
                                                        }}
                                                        components={{ bold: <strong /> }}
                                                    />
                                                </div>
                                            ) : (
                                                t(
                                                    'This action will delete your Ansible job template. Are you sure that you want to continue?'
                                                )
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
                                            keyFn: (curator: ClusterCurator) => curator.metadata.uid as string,
                                            actionFn: deleteResource,
                                            close: () => setBulkModalProps({ open: false }),
                                            isDanger: true,
                                            icon: 'warning',
                                        })
                                    },
                                },
                            ]

                            return (
                                <RbacDropdown<ClusterCurator>
                                    id={`${curator.metadata.name}-actions`}
                                    item={curator}
                                    isKebab={true}
                                    text={`${curator.metadata.name}-actions`}
                                    actions={actions}
                                />
                            )
                        },
                    },
                ]}
                keyFn={(clusterCurator: ClusterCurator) => {
                    return clusterCurator.metadata.uid as string
                }}
                tableActionButtons={[
                    {
                        id: 'add',
                        title: t('Create Ansible template'),
                        click: () => {
                            history.push(NavigationPath.addAnsibleAutomation)
                        },
                        variant: ButtonVariant.primary,
                    },
                ]}
                tableActions={[
                    {
                        id: 'deleteTemplate',
                        title: t('Delete templates'),
                        click: (curators: ClusterCurator[]) => {
                            setBulkModalProps({
                                open: true,
                                title: t('Delete templates'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                resources: [...curators],
                                description: t(
                                    'This action will delete Ansible job templates and will unlink any associated Ansible credential. Are you sure that you want to continue?'
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
                                keyFn: (curator: ClusterCurator) => curator.metadata.uid as string,
                                actionFn: deleteResource,
                                close: () => setBulkModalProps({ open: false }),
                                isDanger: true,
                                icon: 'warning',
                            })
                        },
                        variant: 'bulk-action',
                    },
                ]}
                emptyState={
                    <AcmEmptyState
                        title={t("You don't have any Ansible job templates")}
                        message={
                            <Trans
                                i18nKey={t(
                                    'Select <bold>Create Ansible template</bold> to create an Ansible job template.'
                                )}
                                components={{ bold: <strong /> }}
                            />
                        }
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => {
                                    // TODO: make sure addtemplate can handle new ansible Automations
                                    history.push(NavigationPath.addAnsibleAutomation)
                                }}
                                // disabled={}
                                // tooltip={t('common:rbac.unauthorized')}
                                hidden
                            >
                                {t('Create Ansible template')}
                            </AcmButton>
                        }
                    />
                }
            ></AcmTable>
        </Fragment>
    )
}

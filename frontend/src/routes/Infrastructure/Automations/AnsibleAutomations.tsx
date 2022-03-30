/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { ButtonVariant, Hint, PageSection, TextContent } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmRoute,
    AcmTable,
} from '@stolostron/ui-components'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, clusterCuratorsState, configMapsState, secretsState } from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { DropdownActionModal, IDropdownActionModalProps } from '../../../components/DropdownActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS, viewDocumentation } from '../../../lib/doc-util'
import { rbacDelete, rbacPatch } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import {
    ClusterCurator,
    deleteResource,
    filterForTemplatedCurators,
    getTemplateJobsNum,
    LinkAnsibleCredential,
    unpackProviderConnection,
} from '../../../resources'

export default function AnsibleAutomationsPage() {
    const [, setRoute] = useRecoilState(acmRouteState)
    const [configMaps] = useRecoilState(configMapsState)
    useEffect(() => setRoute(AcmRoute.Automation), [setRoute])

    const alertContext = useContext(AcmAlertContext)

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <AcmPage hasDrawer header={<AcmPageHeader title={t('template.title')} />}>
            <AcmPageContent id="clusters">
                <PageSection>
                    <Hint className={classes.hint}>
                        <div>
                            {t('template.hint')}{' '}
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
                                {t('template.operator.link')}
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
                        header: t('table.name'),
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
                        header: t('table.linkedCred'),
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
                                                i18nKey="template.modal.noCredentials"
                                                components={{ bold: <strong /> }}
                                            />
                                        }
                                        isDisabled={ansibleCredentials.length === 0}
                                        onClick={() => {
                                            setDropdownModalProps({
                                                open: true,
                                                title: t('template.modal.linkProvider.title'),
                                                action: t('template.modal.linkProvider.submit'),
                                                processing: t('template.modal.linkProvider.submitting'),
                                                resource: clusterCurator,
                                                description: t('template.modal.linkProvider.message'),
                                                actionFn: LinkAnsibleCredential,
                                                close: () => setDropdownModalProps({ open: false }),
                                                isDanger: false,
                                                selectOptions: ansibleCredentials.map(
                                                    (credential) => credential.metadata.name as string
                                                ),
                                                selectLabel: t('template.modal.linkProvider.label'),
                                                selectPlaceholder: t('template.modal.linkProvider.placeholder'),
                                                confirmText: 'Link',
                                            })
                                        }}
                                    >
                                        {t('template.link')}
                                    </AcmButton>
                                )
                            } else return clusterCurator.spec.install.towerAuthSecret
                        },
                    },
                    {
                        header: t('table.jobTemplate'),
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
                                    text: t('template.edit'),
                                    isAriaDisabled: true,
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
                                    text: t('template.delete'),
                                    isAriaDisabled: true,
                                    rbac: [rbacDelete(curator)],
                                    click: (curator: ClusterCurator) => {
                                        setBulkModalProps({
                                            open: true,
                                            title: t('template.modal.delete.title'),
                                            action: t('delete'),
                                            processing: t('deleting'),
                                            resources: [curator],
                                            description: curator.spec?.install?.towerAuthSecret ? (
                                                <div>
                                                    <Trans
                                                        i18nKey="template.modal.delete.message.linked"
                                                        values={{
                                                            curatorTemplate: curator.metadata.name as string,
                                                            ansibleCredential: curator.spec.install
                                                                .towerAuthSecret as string,
                                                        }}
                                                        components={{ bold: <strong /> }}
                                                    />
                                                </div>
                                            ) : (
                                                t('template.modal.delete.message.noLink')
                                            ),
                                            columns: [
                                                {
                                                    header: t('table.name'),
                                                    cell: 'metadata.name',
                                                    sort: 'metadata.name',
                                                },
                                                {
                                                    header: t('table.namespace'),
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
                        title: t('template.create'),
                        click: () => {
                            history.push(NavigationPath.addAnsibleAutomation)
                        },
                        variant: ButtonVariant.primary,
                    },
                ]}
                tableActions={[
                    {
                        id: 'deleteTemplate',
                        title: t('bulk.delete.templates'),
                        click: (curators: ClusterCurator[]) => {
                            setBulkModalProps({
                                open: true,
                                title: t('bulk.delete.templates'),
                                action: t('delete'),
                                processing: t('deleting'),
                                resources: [...curators],
                                description: t('bulk.delete.templates.message'),
                                columns: [
                                    {
                                        header: t('table.name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('table.namespace'),
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
                        title={t('template.emptyStateHeader')}
                        message={<Trans i18nKey={'template.emptyStateMsg'} components={{ bold: <strong /> }} />}
                        action={
                            <div>
                                <AcmButton
                                    role="link"
                                    onClick={() => {
                                        // TODO: make sure addtemplate can handle new ansible Automations
                                        history.push(NavigationPath.addAnsibleAutomation)
                                    }}
                                    // disabled={}
                                    // tooltip={t('rbac.unauthorized')}
                                    hidden
                                >
                                    {t('template.create')}
                                </AcmButton>
                                <TextContent>{viewDocumentation(DOC_LINKS.ANSIBLE_JOBS, t)}</TextContent>
                            </div>
                        }
                    />
                }
            ></AcmTable>
        </Fragment>
    )
}

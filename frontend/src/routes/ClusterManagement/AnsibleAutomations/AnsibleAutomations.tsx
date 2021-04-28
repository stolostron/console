/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
// import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, secretsState } from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { DropdownActionModal, IDropdownActionModalProps } from '../../../components/DropdownActionModal'
import { deleteResource } from '../../../lib/resource-request'
import {
    ClusterCurator,
    filterForTemplatedCurators,
    getTemplateJobsNum,
    LinkAnsibleCredential,
} from '../../../resources/cluster-curator'
import { unpackProviderConnection } from '../../../resources/provider-connection'

export default function AnsibleAutomationsPage() {
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection variant="light" isFilled={true}>
                <AnsibleJobTemplateTable></AnsibleJobTemplateTable>
            </PageSection>
        </AcmPageContent>
    )
}

function AnsibleJobTemplateTable() {
    // Load Data
    const [secrets] = useRecoilState(secretsState)
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const templatedCurators = useMemo(() => filterForTemplatedCurators(clusterCurators), [clusterCurators])
    const ansibleCredentials = providerConnections.map((providerConnection) => {
        if (providerConnection.spec?.host) {
            return providerConnection.metadata.name as string
        } else return ''
    })

    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<ClusterCurator> | { open: false }>({
        open: false,
    })

    const [dropdownModalProps, setDropdownModalProps] = useState<
        IDropdownActionModalProps<ClusterCurator> | { open: false }
    >({
        open: false,
    })
    const { t } = useTranslation(['cluster', 'common'])

    //const history = useHistory()

    // Set table
    return (
        <Fragment>
            <BulkActionModel<ClusterCurator> {...bulkModalProps} />
            <DropdownActionModal<ClusterCurator> {...dropdownModalProps} />
            <AcmTable<ClusterCurator>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="templates"
                items={templatedCurators}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (clusterCurator) => {
                            return clusterCurator.metadata.name
                        },
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
                                                i18nKey="cluster:template.modal.noCredentials"
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
                                                selectOptions: ansibleCredentials,
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
                ]}
                keyFn={(clusterCurator: ClusterCurator) => {
                    return clusterCurator.metadata.uid as string
                }}
                tableActions={[
                    {
                        id: 'add',
                        title: t('template.create'),
                        click: () => {
                            // history.push(NavigationPath.addIntegration)
                        },
                    },
                ]}
                rowActions={[
                    {
                        id: 'edit-template',
                        title: t('template.edit'),
                        click: () => {
                            // history.push(NavigationPath.addIntegration)
                        },
                    },
                    {
                        id: 'delete',
                        title: t('template.delete'),
                        click: (curator) => {
                            setBulkModalProps({
                                open: true,
                                title: t('template.modal.delete.title'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: [curator],
                                description: curator.spec?.install?.towerAuthSecret ? (
                                    <div>
                                        <Trans
                                            i18nKey="cluster:template.modal.delete.message.linked"
                                            values={{
                                                curatorTemplate: curator.metadata.name as string,
                                                ansibleCredential: curator.spec.install.towerAuthSecret as string,
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
                            })
                        },
                    },
                ]}
                bulkActions={[
                    {
                        id: 'deleteTemplate',
                        title: t('bulk.delete.templates'),
                        click: (curators: ClusterCurator[]) => {
                            setBulkModalProps({
                                open: true,
                                title: t('bulk.delete.templates'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
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
                            })
                        },
                    },
                ]}
                emptyState={
                    <AcmEmptyState
                        title={t('template.emptyStateHeader')}
                        message={<Trans i18nKey={t('template.emptyStateMsg')} components={{ bold: <strong /> }} />}
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => {
                                    // TODO: make sure addtemplate can handle new ansible Automations
                                    //history.push(NavigationPath.addIntegration)
                                }}
                                // disabled={}
                                // tooltip={t('common:rbac.unauthorized')}
                                hidden
                            >
                                {t('template.create')}
                            </AcmButton>
                        }
                    />
                }
            ></AcmTable>
        </Fragment>
    )
}

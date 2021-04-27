/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { PageSection, Button } from '@patternfly/react-core'
import { mapProps, TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, secretsState } from '../../../atoms'
import { errorIsNot, BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { deleteResource, replaceResource } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import { AnsibleTowerSecret, filterForAnsibleSecrets } from '../../../resources/ansible-tower-secret'
import {
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    filterForTemplatedCurators,
    getTemplateJobsNum,
    LinkAnsibleCredential,
} from '../../../resources/cluster-curator'
import { DropdownActionModal, IDropdownActionModalProps } from '../../../components/DropdownActionModal'
import { filterForProviderSecrets } from '../../../resources/provider-connection'
import { Resource } from 'i18next'
import { IResource } from '../../../resources/resource'
import { Secret } from '../../../resources/secret'

export default function IntegrationsPage() {
    const alertContext = useContext(AcmAlertContext)
    const [secrets] = useRecoilState(secretsState)
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection variant="light" isFilled={true}>
                <IntegrationTable secrets={secrets} clusterCurators={clusterCurators}></IntegrationTable>
            </PageSection>
        </AcmPageContent>
    )
}

function IntegrationTable(props: { secrets: Secret[]; clusterCurators: ClusterCurator[] }) {
    // Load Data
    const { secrets, clusterCurators } = props
    console.log('checking secrets: ', secrets)
    const ansibleSecrets = filterForAnsibleSecrets(secrets)
    const templatedCurators = useMemo(() => filterForTemplatedCurators(clusterCurators), [clusterCurators])

    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<ClusterCurator> | { open: false }>({
        open: false,
    })

    const [dropdownModalProps, setDropdownModalProps] = useState<
        IDropdownActionModalProps<ClusterCurator> | { open: false }
    >({
        open: false,
    })
    const { t } = useTranslation(['cluster'])

    const history = useHistory()

    const actionFn = (curatorTemplate: ClusterCurator, ansibleCredentialName: string) => {
        console.log('in actionFn')
        return LinkAnsibleCredential(curatorTemplate as ClusterCurator, ansibleCredentialName)
    }

    // Set table
    return (
        <Fragment>
            <BulkActionModel<ClusterCurator> {...bulkModalProps} />
            <DropdownActionModal<ClusterCurator> {...dropdownModalProps} />
            <AcmTable<ClusterCurator>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="integrations"
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
                                console.log('checking table curator template', clusterCurator)
                                return (
                                    <Button
                                        isInline
                                        variant="link"
                                        isSmall
                                        onClick={() => {
                                            setDropdownModalProps({
                                                open: true,
                                                title: t('integration.modal.linkProvider.title'),
                                                action: t('integration.modal.linkProvider.submit'),
                                                processing: t('integration.modal.linkProvider.submitting'),
                                                resource: clusterCurator,
                                                description: t('integration.modal.linkProvider.message'),
                                                actionFn: LinkAnsibleCredential,
                                                close: () => setDropdownModalProps({ open: false }),
                                                isDanger: false,
                                                selectOptions: ansibleSecrets.map(
                                                    (secret) => secret.metadata.name as string
                                                ),
                                                selectLabel: t('integration.modal.linkProvider.label'),
                                                selectPlaceholder: t('integration.modal.linkProvider.placeholder'),
                                                confirmText: 'Link',
                                            })
                                        }}
                                    >
                                        {t('integration.link')}
                                    </Button>
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
                        title: t('integration.edit'),
                        click: () => {
                            // history.push(NavigationPath.addIntegration)
                        },
                    },
                    {
                        id: 'delete',
                        title: t('integration.delete'),
                        click: (curator) => {
                            setBulkModalProps({
                                open: true,
                                title: t('integration.modal.delete.title'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: [curator],
                                description: t('integration.modal.delete.message'),
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
                        title={t('integration.emptyStateHeader')}
                        message={
                            <Trans
                                i18nKey={t('integration.emptyStateMsg')}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => {
                                    // TODO: make sure addIntegration can handle new integrations
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

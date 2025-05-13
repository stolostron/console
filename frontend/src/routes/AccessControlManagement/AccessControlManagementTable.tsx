/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant } from '@patternfly/react-core'
import { Fragment, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom-v5-compat'
import { BulkActionModal, BulkActionModalProps } from '../../components/BulkActionModal'
import { Trans, useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../lib/doc-util'
import { rbacCreate, useIsAnyNamespaceAuthorized } from '../../lib/rbac-util'
import { getBackCancelLocationLinkProps, navigateToBackCancelLocation, NavigationPath } from '../../NavigationPath'
import {
    DiscoveryConfig,
    ProviderConnection
} from '../../resources'
import { AccessControl, AccessControlDefinition } from '../../resources/access-control'
import {
    AcmButton,
    AcmEmptyState,
    AcmTable
} from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { accessControlTableColumns, ACTIONS, EXPORT_FILE_PREFIX, useFilters } from './AccessControlManagementTableHelper'

const AccessControlManagementTable = (props: {
    providerConnections?: ProviderConnection[]
    discoveryConfigs?: DiscoveryConfig[]
    accessControls?: AccessControl[]
}) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [modalProps, setModalProps] = useState<BulkActionModalProps<AccessControl> | { open: false }>({
        open: false,
    })
    const canAddAccessControl = useIsAnyNamespaceAuthorized(rbacCreate(AccessControlDefinition))
    const managedClusters = useAllClusters(true)
    const filters = useFilters({ managedClusters, accessControls: props.accessControls, t })

    return (
        <Fragment>
            <BulkActionModal<AccessControl> {...modalProps} />
            <AcmTable<AccessControl>
                showExportButton
                exportFilePrefix={EXPORT_FILE_PREFIX}
                emptyState={
                    <AcmEmptyState
                        title={t(`You don't have any access control`)}
                        message={
                            <Trans
                                i18nKey="Click <bold>Add Access Control</bold> to create your resource."
                                components={{ bold: <strong /> }}
                            />
                        }
                        action={
                            <div>
                                <AcmButton
                                    isDisabled={!canAddAccessControl}
                                    tooltip={!canAddAccessControl ? t('rbac.unauthorized') : ''}
                                    component={Link}
                                    {...getBackCancelLocationLinkProps(NavigationPath.addAccessControlManagement)}
                                >
                                    {t('Add Access Control')}
                                </AcmButton>
                                <ViewDocumentationLink doclink={DOC_LINKS.CREATE_CONNECTION} />
                            </div>
                        }
                    />
                }
                items={props.accessControls}
                filters={filters}
                columns={accessControlTableColumns({ t, setModalProps, navigate })}
                keyFn={(accessControl) => accessControl.metadata?.uid as string}
                tableActionButtons={[
                    {
                        id: 'add',
                        title: t('Add Access Control'),
                        click: () => {
                            navigateToBackCancelLocation(navigate, NavigationPath.addAccessControlManagement)
                        },
                        variant: ButtonVariant.primary,
                        isDisabled: !canAddAccessControl,
                        tooltip: !canAddAccessControl ? t('rbac.unauthorized') : '',
                    },
                ]}
                tableActions={[
                    {
                        id: 'deleteConnection',
                        title: t('Delete Access Controls'),
                        click: (accessControls: AccessControl[]) => ACTIONS.DELETE({ accessControls, setModalProps, t }),
                        variant: 'bulk-action',
                    },
                ]}
                rowActions={[]}
            />
        </Fragment>
    )
}

export { AccessControlManagementTable }

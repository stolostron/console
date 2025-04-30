/* Copyright Contributors to the Open Cluster Management project */
import { Label } from '@patternfly/react-core'
import {
    CheckCircleIcon,
    TimesCircleIcon
} from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import jsYaml from 'js-yaml'
import { Dispatch, SetStateAction, useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link, NavigateFunction } from 'react-router-dom-v5-compat'
import { BulkActionModalProps } from '../../components/BulkActionModal'
import { RbacDropdown } from '../../components/Rbac'
import AcmTimestamp from '../../lib/AcmTimestamp'
import { rbacDelete, rbacGet, rbacPatch } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import { AccessControl } from '../../resources/access-control'
import { Cluster, createDownloadFile, deleteResource, getISOStringTimestamp } from '../../resources/utils'
import {
    AcmLabels,
    compareStrings
} from '../../ui-components'

const LABELS_LENGTH = 5
const EXPORT_FILE_PREFIX = "access-control-management"


type AccessControlManagementTableHelperProps = {
    t: TFunction;
    setModalProps: Dispatch<SetStateAction<BulkActionModalProps<AccessControl> | { open: false; }>>;
    navigate: NavigateFunction;
}

const ACTIONS = {
    EDIT: ({ accessControl, navigate }: { accessControl: AccessControl } & Pick<AccessControlManagementTableHelperProps, 'navigate'>) => {
        navigate(
            generatePath(NavigationPath.editAccessControlManagement, {
                id: accessControl.data?.id!,
            })
        )
    },
    DELETE: ({ accessControls, t, setModalProps }: { accessControls: AccessControl[] } & Pick<AccessControlManagementTableHelperProps, 't' | 'setModalProps'>) => {
        setModalProps({
            open: true,
            title: t('Permanently delete Access Controls?'),
            action: t('Delete'),
            processing: t('Deleting'),
            items: [...accessControls],
            emptyState: undefined, // table action is only enabled when items are selected
            description: t(
                'You cannot create new clusters from deleted Access Controls. Clusters that you previously created will not be affected.'
            ),
            columns: [
                {
                    header: t('ID'),
                    sort: 'data.id',
                    search: 'data.id',
                    cell: (accessControl: AccessControl) => accessControl.data?.id,

                }, {
                    header: t('Cluster'),
                    sort: 'data.cluster',
                    search: 'data.cluster',
                    cell: (accessControl: AccessControl) => accessControl.data?.cluster,
                }, {
                    header: t('Status'),
                    sort: (itemA: AccessControl, itemB: AccessControl) => {
                        const statusA = itemA.data?.isActive === true ? t('Active') : t('Disabled')
                        const statusB = itemB.data?.isActive === true ? t('Active') : t('Disabled')
                        return compareStrings(statusA, statusB)
                    },
                    search: (accessControl: AccessControl) => accessControl.data?.isActive ? 'Active' : 'Disabled',
                    cell: (accessControl: AccessControl) => COLUMN_CELLS.STATUS(accessControl, t),
                },
                {
                    header: t('Created'),
                    sort: 'data.creationTimestamp',
                    cell: COLUMN_CELLS.CREATION_DATE,
                },
            ],
            keyFn: (accessControl: AccessControl) => accessControl.metadata.uid as string,
            actionFn: deleteResource,
            close: () => setModalProps({ open: false }),
            isDanger: true,
        })
    },
    EXPORT_YAML: (accessControl: AccessControl, exportFilePrefix: string) => {
        // TODO: assure proper content from the AccessControl
        const yamlContent = jsYaml.dump(accessControl.data)
        const fileName = `${exportFilePrefix}-${accessControl.data?.id}-${Date.now()}.yaml`
        createDownloadFile(fileName, yamlContent, 'application/yaml')
    }
}

const COLUMN_CELLS = {
    ID: (accessControl: AccessControl) => (
        <span style={{ whiteSpace: 'nowrap' }}>
            <Link
                to={generatePath(NavigationPath.viewAccessControlManagement, {
                    id: accessControl.data?.id!,
                })}
            >
                {accessControl.data?.id}
            </Link>
        </span>
    ),
    CLUSTER: (accessControl: AccessControl) => accessControl.data?.cluster !== '*' ? (<Link
        to={generatePath(NavigationPath.clusterDetails, {
            name: accessControl.data?.cluster!,
            namespace: accessControl.data?.cluster!,
        })}
    >
        {accessControl.data?.cluster}
    </Link>) : '*',
    USER_GROUP: (accessControl: AccessControl, t: TFunction) => accessControl.data?.users ? (
        <AcmLabels
            labels={accessControl.data.users}
            expandedText={t('Show less')}
            collapsedText={t('show.more', { count: accessControl.data.users.length })}
            // TODO: To properly translate 'count.items'
            allCollapsedText={t('count.items', { count: accessControl.data.users.length })}
            isCompact={accessControl.data.users.length > LABELS_LENGTH}
        />
    ) : '-',
    ROLES: (accessControl: AccessControl, t: TFunction) => accessControl.data?.roles ? (
        <AcmLabels
            labels={accessControl.data.roles}
            expandedText={t('Show less')}
            collapsedText={t('show.more', { count: accessControl.data.roles.length })}
            // TODO: To properly translate 'count.items'
            allCollapsedText={t('count.items', { count: accessControl.data.roles.length })}
            isCompact={accessControl.data.roles.length > LABELS_LENGTH}
        />
    ) : '-',
    NAMESPACES: (accessControl: AccessControl, t: TFunction) => accessControl.data?.namespaces ? (
        <AcmLabels
            labels={accessControl.data.namespaces}
            expandedText={t('Show less')}
            collapsedText={t('show.more', { count: accessControl.data.namespaces.length })}
            // TODO: To properly translate 'count.items'
            allCollapsedText={t('count.items', { count: accessControl.data.namespaces.length })}
            isCompact={accessControl.data.namespaces.length > LABELS_LENGTH}
        />
    ) : '-',
    STATUS: (accessControl: AccessControl, t: TFunction) => <span style={{ whiteSpace: 'nowrap' }}>
        {
            accessControl.data?.isActive ?
                <Label color="green" icon={<CheckCircleIcon />}>{t('Active')}</Label>
                : <Label color="red" icon={<TimesCircleIcon />}>{t('Disabled')}</Label>
        }
    </span>,
    CREATION_DATE: (accessControl: AccessControl) => (
        <span style={{ whiteSpace: 'nowrap' }}>
            <AcmTimestamp timestamp={accessControl.data?.creationTimestamp} />
        </span>
    ),
    ACTIONS: (accessControl: AccessControl, t: AccessControlManagementTableHelperProps['t'], setModalProps: AccessControlManagementTableHelperProps['setModalProps'], navigate: AccessControlManagementTableHelperProps['navigate']) => (
        <RbacDropdown<AccessControl>
            id={`${accessControl.metadata.name}-actions`}
            item={accessControl}
            isKebab={true}
            text={t('Actions')}
            actions={[
                {
                    id: 'editAccessControl',
                    text: t('Edit Access Control'),
                    isAriaDisabled: true,
                    click: (accessControl) => ACTIONS.EDIT({ accessControl, navigate }),
                    rbac: [rbacPatch(accessControl)], // TODO: is this the proper way for checking RBAC
                },
                {
                    id: 'deleteAccessControl',
                    text: t('Delete Access Control'),
                    isAriaDisabled: true,
                    click: (accessControl) => ACTIONS.DELETE({ accessControls: [accessControl], setModalProps, t }),
                    rbac: [rbacDelete(accessControl)],
                },
                {
                    id: 'exportAccessControl',
                    text: t('Export to YAML'),
                    isAriaDisabled: true,
                    click: (accessControl) => ACTIONS.EXPORT_YAML(accessControl, EXPORT_FILE_PREFIX),
                    rbac: [rbacGet(accessControl)],
                },
            ]}
        />
    )
}

const accessControlTableColumns = ({ t, setModalProps, navigate }: AccessControlManagementTableHelperProps) => [
    {
        header: t('ID'),
        sort: 'data.id',
        search: 'data.id',
        cell: COLUMN_CELLS.ID,
        exportContent: (accessControl: AccessControl) => accessControl.data?.id!,
    }, {
        header: t('Cluster'),
        sort: 'data.cluster',
        search: 'data.cluster',
        cell: COLUMN_CELLS.CLUSTER,
        exportContent: (accessControl: AccessControl) => accessControl.data?.cluster!,
    }, {
        header: t('Users/Groups'),
        // TODO: users or groups
        sort: 'data.users',
        search: 'data.users',
        cell: (accessControl: AccessControl) => COLUMN_CELLS.USER_GROUP(accessControl, t),
        exportContent: (accessControl: AccessControl) => accessControl.data?.users!,
    }, {
        header: t('Roles'),
        sort: 'data.roles',
        search: 'data.roles',
        cell: (accessControl: AccessControl) => COLUMN_CELLS.ROLES(accessControl, t),
        exportContent: (accessControl: AccessControl) => accessControl.data?.roles!,
    }, {
        header: t('Namespaces'),
        sort: 'data.namespaces',
        search: 'data.namespaces',
        cell: (accessControl: AccessControl) => COLUMN_CELLS.NAMESPACES(accessControl, t),
        exportContent: (accessControl: AccessControl) => accessControl.data?.namespaces!,
    }, {
        header: t('Status'),
        sort: (itemA: AccessControl, itemB: AccessControl) => {
            const statusA = itemA.data?.isActive === true ? t('Active') : t('Disabled')
            const statusB = itemB.data?.isActive === true ? t('Active') : t('Disabled')
            return compareStrings(statusA, statusB)
        },
        search: (item: AccessControl) => item.data?.isActive ? 'Active' : 'Disabled',
        cell: (accessControl: AccessControl) => COLUMN_CELLS.STATUS(accessControl, t),
        exportContent: (accessControl: AccessControl) => accessControl.data?.isActive ? 'Active' : 'Disabled',
    },
    {
        header: t('Created'),
        sort: 'data.creationTimestamp',
        cell: COLUMN_CELLS.CREATION_DATE,
        exportContent: (accessControl: AccessControl) => accessControl.data?.creationTimestamp ? getISOStringTimestamp(accessControl.data?.creationTimestamp) : '',
    },
    {
        header: '',
        cellTransforms: [fitContent],
        cell: (accessControl: AccessControl) => COLUMN_CELLS.ACTIONS(accessControl, t, setModalProps, navigate),
    },
];

const useFilters = ({ managedClusters, accessControls, t }: { managedClusters: Cluster[], accessControls: AccessControl[] | undefined, t: TFunction }) => {
    return useMemo(
        () => [
            {
                id: 'cluster',
                label: t('Cluster'),
                options: Object.values(managedClusters)
                    .map((cluster) => ({
                        label: cluster.name,
                        value: cluster.name,
                    }))
                    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                tableFilterFn: (selectedValues: string[], item: AccessControl) => selectedValues.includes(item.data?.cluster ?? ''),
            }, {
                id: 'status',
                label: t('Status'),
                options: ['Active', 'Disabled'].map(e => ({ label: e, value: e })),
                tableFilterFn: (selectedValues: string[], item: AccessControl) => selectedValues.map(e => e === 'Active').some(e => item.data?.isActive === e),
            },
            {
                id: 'user',
                label: t('access.add.user'),
                options: [...new Set(accessControls?.flatMap(accessControl => accessControl.data?.users ?? []))].map(e => ({ label: e, value: e })).sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                tableFilterFn: (selectedValues: string[], item: AccessControl) => selectedValues.some(e => item.data?.users?.includes(e)),
            },
            {
                id: 'group',
                label: t('access.add.group'),
                options: [...new Set(accessControls?.flatMap(accessControl => accessControl.data?.groups ?? []))].map(e => ({ label: e, value: e })).sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                tableFilterFn: (selectedValues: string[], item: AccessControl) => selectedValues.some(e => item.data?.groups?.includes(e)),
            },
            {
                id: 'role',
                label: t('Role'),
                options: [...new Set(accessControls?.flatMap(accessControl => accessControl.data?.roles ?? []))].map(e => ({ label: e, value: e })).sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                tableFilterFn: (selectedValues: string[], item: AccessControl) => selectedValues.some(e => item.data?.roles?.includes(e)),
            },
        ],
        [t, managedClusters, accessControls]
    )
}

export { accessControlTableColumns, ACTIONS, COLUMN_CELLS, EXPORT_FILE_PREFIX, useFilters }


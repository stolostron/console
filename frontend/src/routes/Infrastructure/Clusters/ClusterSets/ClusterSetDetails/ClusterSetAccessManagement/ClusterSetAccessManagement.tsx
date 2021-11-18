/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    ClusterRoleBinding,
    ClusterRoleBindingKind,
    ClusterRoleKind,
    createResource,
    deleteResource,
    Group,
    listClusterRoleBindings,
    listGroups,
    listUsers,
    RbacApiVersion,
    ResourceErrorCode,
    User,
} from '../../../../../../resources'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmEmptyState,
    AcmForm,
    AcmLabels,
    AcmModal,
    AcmPageContent,
    AcmSelect,
    AcmSubmit,
    AcmTable,
    compareStrings,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    ButtonVariant,
    ModalVariant,
    PageSection,
    Popover,
    SelectOption,
    ToggleGroup,
    ToggleGroupItem,
} from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useCallback, useContext, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../../components/BulkActionModel'
import { ErrorPage, getErrorInfo } from '../../../../../../components/ErrorPage'
import { useQuery } from '../../../../../../lib/useQuery'
import { ClusterSetContext } from '../ClusterSetDetails'

export function ClusterSetAccessManagement() {
    const { t } = useTranslation()
    const { clusterSet } = useContext(ClusterSetContext)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ClusterRoleBinding> | { open: false }>({
        open: false,
    })
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false)

    const { data, refresh, error } = useQuery(useCallback(() => listClusterRoleBindings(), []))
    const { data: users } = useQuery(useCallback(() => listUsers(), []))
    const { data: groups } = useQuery(useCallback(() => listGroups(), []))

    let clusterRoleBindings: ClusterRoleBinding[] | undefined
    if (data) {
        clusterRoleBindings = data.filter((item) => {
            const role = item.roleRef.name
            return (
                role.startsWith('open-cluster-management:managedclusterset:') &&
                role.endsWith(`:${clusterSet!.metadata.name!}`)
            )
        })
    }

    function keyFn(item: ClusterRoleBinding) {
        return item.metadata.uid!
    }

    const columns = useMemo<IAcmTableColumn<ClusterRoleBinding>[]>(
        () => [
            {
                header: t('Name'),
                sort: (a: ClusterRoleBinding, b: ClusterRoleBinding) => {
                    const aValue = a.subjects?.[0]?.name ?? ''
                    const bValue = b.subjects?.[0]?.name ?? ''
                    return compareStrings(aValue, bValue)
                },
                search: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects[0].name,
                cell: (clusterRoleBinding: ClusterRoleBinding) => {
                    if (clusterRoleBinding.subjects[0].kind === 'User') {
                        return clusterRoleBinding.subjects[0].name
                    } else {
                        return (
                            <span style={{ display: 'flex' }}>
                                {clusterRoleBinding.subjects[0].name}{' '}
                                <GroupUsersPopover
                                    useIcon
                                    group={groups?.find(
                                        (group) => group.metadata.name === clusterRoleBinding.subjects[0].name
                                    )}
                                />
                            </span>
                        )
                    }
                },
            },
            {
                header: t('Display role'),
                sort: 'roleRef.name',
                search: 'roleRef.name',
                cell: (clusterRoleBinding: ClusterRoleBinding) => {
                    if (
                        clusterRoleBinding.roleRef.name ===
                        `open-cluster-management:managedclusterset:admin:${clusterSet!.metadata.name!}`
                    ) {
                        return t('Cluster set admin')
                    } else if (
                        clusterRoleBinding.roleRef.name ===
                        `open-cluster-management:managedclusterset:view:${clusterSet!.metadata.name!}`
                    ) {
                        return t('Cluster set view')
                    }
                    return '-'
                },
            },
            {
                header: t('Cluster role'),
                sort: 'roleRef.name',
                search: 'roleRef.name',
                cell: 'roleRef.name',
            },
            {
                header: t('Type'),
                sort: (a: ClusterRoleBinding, b: ClusterRoleBinding) => {
                    const aValue = a.subjects?.[0]?.kind ?? ''
                    const bValue = b.subjects?.[0]?.kind ?? ''
                    return compareStrings(aValue, bValue)
                },
                search: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects[0].kind,
                cell: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects[0].kind,
            },
        ],
        [t, groups, clusterSet]
    )

    if (error) {
        return <ErrorPage error={error} />
    }

    return (
        <AcmPageContent id="access-management">
            <PageSection>
                <BulkActionModel<ClusterRoleBinding> {...modalProps} />
                <AddUsersModal
                    isOpen={addModalOpen}
                    onClose={() => {
                        refresh()
                        setAddModalOpen(false)
                    }}
                    clusterRoleBindings={clusterRoleBindings}
                    users={users}
                    groups={groups}
                />
                <AcmTable<ClusterRoleBinding>
                    plural="clusterRoleBindings"
                    items={clusterRoleBindings}
                    keyFn={keyFn}
                    columns={columns}
                    tableActionButtons={[
                        {
                            id: 'addUserGroup',
                            title: t('Add user or group'),
                            click: () => setAddModalOpen(true),
                            variant: ButtonVariant.primary,
                        },
                    ]}
                    tableActions={[
                        {
                            id: 'removeAuthorization',
                            title: t('Remove'),
                            click: (clusterRoleBindings: ClusterRoleBinding[]) => {
                                setModalProps({
                                    open: true,
                                    title: t('Remove users or groups?'),
                                    action: t('Remove'),
                                    processing: t('Removing'),
                                    resources: clusterRoleBindings,
                                    description: t(
                                        'Removing a user or group revokes access permissions to the cluster set and all of its associated clusters. These permissions can be re-assigned to users and groups at any time.'
                                    ),
                                    columns: columns,
                                    keyFn,
                                    actionFn: deleteResource,
                                    close: () => {
                                        refresh()
                                        setModalProps({ open: false })
                                    },
                                    isDanger: true,
                                    icon: 'warning',
                                    isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                })
                            },
                            variant: 'bulk-action',
                        },
                    ]}
                    rowActions={[
                        {
                            id: 'removeAuthorization',
                            title: t('Remove'),
                            click: (clusterRoleBinding: ClusterRoleBinding) => {
                                setModalProps({
                                    open: true,
                                    title: t('Remove users or groups?'),
                                    action: t('Remove'),
                                    processing: t('Removing'),
                                    resources: [clusterRoleBinding],
                                    description: t(
                                        'Removing a user or group revokes access permissions to the cluster set and all of its associated clusters. These permissions can be re-assigned to users and groups at any time.'
                                    ),
                                    columns: columns,
                                    keyFn,
                                    actionFn: deleteResource,
                                    close: () => {
                                        refresh()
                                        setModalProps({ open: false })
                                    },
                                    isDanger: true,
                                    icon: 'warning',
                                    isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                })
                            },
                        },
                    ]}
                    emptyState={
                        <AcmEmptyState
                            key="accessEmptyState"
                            title={t('No users or groups found')}
                            message={
                                <Trans
                                    i18nKey={
                                        "This cluster set doesn't have any users or groups, yet. Click the <bold>Add user or group</bold> button to add a user or group."
                                    }
                                    components={{ bold: <strong /> }}
                                />
                            }
                            action={
                                <AcmButton variant="primary" onClick={() => setAddModalOpen(true)}>
                                    {t('Add user or group')}
                                </AcmButton>
                            }
                        />
                    }
                />
            </PageSection>
        </AcmPageContent>
    )
}

const useStyles = makeStyles({
    container: {
        display: 'flex',
        '& .pf-c-form__group': {
            flex: 1,
        },
        '& .pf-c-toggle-group': {
            alignSelf: 'flex-end',
        },
    },
})

function AddUsersModal(props: {
    isOpen: boolean
    onClose: () => void
    clusterRoleBindings?: ClusterRoleBinding[]
    users?: User[]
    groups?: Group[]
}) {
    const classes = useStyles()
    const { t } = useTranslation()
    const { clusterSet } = useContext(ClusterSetContext)
    const [type, setType] = useState<'User' | 'Group'>('User')
    const [userGroup, setUserGroup] = useState<string | undefined>()
    const [role, setRole] = useState<string | undefined>()

    const reset = () => {
        setType('User')
        setUserGroup(undefined)
        setRole(undefined)
        props.onClose()
    }

    const filteredUsers: User[] =
        props.users?.filter(
            (user) =>
                !props.clusterRoleBindings?.find(
                    (crb) => crb.subjects[0].kind === 'User' && crb.subjects[0].name === user.metadata.name
                )
        ) ?? []

    const filteredGroups: Group[] =
        props.groups?.filter(
            (group) =>
                !props.clusterRoleBindings?.find(
                    (crb) => crb.subjects[0].kind === 'Group' && crb.subjects[0].name === group.metadata.name
                )
        ) ?? []

    const selectType = (type: 'User' | 'Group') => {
        setType(type)
        setUserGroup(undefined)
    }

    return (
        <AcmModal variant={ModalVariant.medium} title={t('Add user or group')} isOpen={props.isOpen} onClose={reset}>
            <AcmForm style={{ gap: 0 }}>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <div>
                                {t(
                                    'Adding a user or group will grant access permissions to the cluster set and all of its associated clusters. These permissions can be revoked at any time.'
                                )}
                            </div>
                            &nbsp;
                            <div className={classes.container}>
                                <AcmSelect
                                    id="role"
                                    variant="typeahead"
                                    maxHeight="6em"
                                    isRequired
                                    label={t('Select user or group')}
                                    placeholder={type === 'User' ? t('Select user') : t('Select group')}
                                    value={userGroup}
                                    onChange={(userGroup) => setUserGroup(userGroup)}
                                >
                                    {type === 'User'
                                        ? filteredUsers.map((item: User) => (
                                              <SelectOption key={item.metadata.uid} value={item.metadata.name}>
                                                  {item.metadata.name}
                                              </SelectOption>
                                          ))
                                        : filteredGroups.map((item: Group) => (
                                              <SelectOption key={item.metadata.uid} value={item.metadata.name}>
                                                  {item.metadata.name}
                                              </SelectOption>
                                          ))}
                                </AcmSelect>
                                <ToggleGroup>
                                    <ToggleGroupItem
                                        text={t('Users')}
                                        buttonId="user"
                                        isSelected={type === 'User'}
                                        onChange={() => selectType('User')}
                                    />
                                    <ToggleGroupItem
                                        text={t('Groups')}
                                        buttonId="group"
                                        isSelected={type === 'Group'}
                                        onChange={() => selectType('Group')}
                                    />
                                </ToggleGroup>
                            </div>
                            {type === 'Group' && (
                                <GroupUsersPopover
                                    group={filteredGroups.find((group) => group.metadata.name === userGroup)}
                                />
                            )}
                            &nbsp;
                            <AcmSelect
                                id="role"
                                maxHeight="6em"
                                isRequired
                                label={t('Select role')}
                                placeholder={t('Select role')}
                                value={role}
                                onChange={(role) => setRole(role)}
                            >
                                {[
                                    {
                                        displayName: t('Cluster set admin'),
                                        role: `open-cluster-management:managedclusterset:admin:${clusterSet!.metadata
                                            .name!}`,
                                    },
                                    {
                                        displayName: t('Cluster set view'),
                                        role: `open-cluster-management:managedclusterset:view:${clusterSet!.metadata
                                            .name!}`,
                                    },
                                ].map((role) => (
                                    <SelectOption key={role.role} value={role.role} description={role.role}>
                                        {role.displayName}
                                    </SelectOption>
                                ))}
                            </AcmSelect>
                            <AcmAlertGroup isInline canClose />
                            <ActionGroup>
                                <AcmSubmit
                                    id="add-access"
                                    variant="primary"
                                    label={t('Add')}
                                    processingLabel={t('Adding')}
                                    onClick={() => {
                                        alertContext.clearAlerts()
                                        const resource: ClusterRoleBinding = {
                                            apiVersion: RbacApiVersion,
                                            kind: ClusterRoleBindingKind,
                                            metadata: {
                                                generateName: `${clusterSet?.metadata.name}-`,
                                            },
                                            subjects: [
                                                {
                                                    kind: type,
                                                    apiGroup: 'rbac.authorization.k8s.io',
                                                    name: userGroup!,
                                                },
                                            ],
                                            roleRef: {
                                                apiGroup: 'rbac.authorization.k8s.io',
                                                kind: ClusterRoleKind,
                                                name: role!,
                                            },
                                        }
                                        return createResource(resource)
                                            .promise.then(() => reset())
                                            .catch((err) => {
                                                const errorInfo = getErrorInfo(err)
                                                alertContext.addAlert({
                                                    type: 'danger',
                                                    title: errorInfo.title,
                                                    message: errorInfo.message,
                                                })
                                            })
                                    }}
                                />
                                <AcmButton key="cancel" variant="link" onClick={reset}>
                                    {t('Cancel')}
                                </AcmButton>
                            </ActionGroup>
                        </>
                    )}
                </AcmAlertContext.Consumer>
            </AcmForm>
        </AcmModal>
    )
}

function GroupUsersPopover(props: { group?: Group; useIcon?: boolean }) {
    const { t } = useTranslation()

    if (!props.group) {
        return null
    }
    return (
        <div>
            <Popover headerContent={t('Users in group')} bodyContent={<AcmLabels labels={props.group.users} />}>
                <AcmButton
                    style={{ padding: props.useIcon ? 0 : undefined, paddingLeft: '4px' }}
                    variant={props.useIcon ? ButtonVariant.plain : ButtonVariant.link}
                    aria-label={t('View users in group')}
                >
                    {props.useIcon ? (
                        <OutlinedQuestionCircleIcon
                            style={{ width: '14px', fill: 'var(--pf-global--link--Color)', paddingTop: '2px' }}
                        />
                    ) : (
                        t('View users in group')
                    )}
                </AcmButton>
            </Popover>
        </div>
    )
}

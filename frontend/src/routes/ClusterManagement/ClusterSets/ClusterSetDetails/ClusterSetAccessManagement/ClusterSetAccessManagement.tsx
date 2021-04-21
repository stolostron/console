/* Copyright Contributors to the Open Cluster Management project */

import { useState, useContext, useCallback, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
    PageSection,
    ModalVariant,
    ActionGroup,
    SelectOption,
    ToggleGroup,
    ToggleGroupItem,
    Popover,
    ButtonVariant,
} from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import {
    AcmPageContent,
    AcmExpandableCard,
    AcmTable,
    AcmEmptyState,
    AcmButton,
    AcmModal,
    AcmForm,
    AcmAlertContext,
    AcmAlertGroup,
    AcmSubmit,
    AcmSelect,
    AcmLabels,
    compareStrings,
} from '@open-cluster-management/ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import {
    listClusterRoleBindings,
    listUsers,
    listGroups,
    ClusterRoleBinding,
    ClusterRoleBindingKind,
    User,
    Group,
    RbacApiVersion,
    ClusterRoleKind,
} from '../../../../../resources/rbac'
import { useQuery } from '../../../../../lib/useQuery'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../components/BulkActionModel'
import { deleteResource, ResourceErrorCode } from '../../../../../lib/resource-request'
import { ErrorPage, getErrorInfo } from '../../../../../components/ErrorPage'
import { makeStyles } from '@material-ui/styles'
import { createResource } from '../../../../../lib/resource-request'

export function ClusterSetAccessManagement() {
    const { t } = useTranslation(['cluster'])
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

    const columns = useMemo(
        () => [
            {
                header: t('table.name'),
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
                header: t('table.role'),
                sort: 'roleRef.name',
                search: 'roleRef.name',
                cell: 'roleRef.name',
            },
            {
                header: t('table.type'),
                sort: (a: ClusterRoleBinding, b: ClusterRoleBinding) => {
                    const aValue = a.subjects?.[0]?.kind ?? ''
                    const bValue = b.subjects?.[0]?.kind ?? ''
                    return compareStrings(aValue, bValue)
                },
                search: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects[0].kind,
                cell: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects[0].kind,
            },
        ],
        [t, groups]
    )

    if (error) {
        return <ErrorPage error={error} />
    }

    return (
        <AcmPageContent id="access-management">
            <PageSection>
                <AcmExpandableCard title={t('access.userGroups')}>
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
                        gridBreakPoint={TableGridBreakpoint.none}
                        plural="clusterRoleBindings"
                        items={clusterRoleBindings}
                        keyFn={keyFn}
                        columns={columns}
                        tableActions={[
                            { id: 'addUserGroup', title: t('access.add'), click: () => setAddModalOpen(true) },
                        ]}
                        bulkActions={[
                            {
                                id: 'removeAuthorization',
                                title: t('access.remove'),
                                click: (clusterRoleBindings: ClusterRoleBinding[]) => {
                                    setModalProps({
                                        open: true,
                                        title: t('bulk.title.removeAuthorization'),
                                        action: t('remove'),
                                        processing: t('removing'),
                                        resources: clusterRoleBindings,
                                        description: t('bulk.message.removeAuthorization'),
                                        columns: columns,
                                        keyFn,
                                        actionFn: deleteResource,
                                        close: () => {
                                            refresh()
                                            setModalProps({ open: false })
                                        },
                                        isDanger: true,
                                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                    })
                                },
                            },
                        ]}
                        rowActions={[
                            {
                                id: 'removeAuthorization',
                                title: t('access.remove'),
                                click: (clusterRoleBinding: ClusterRoleBinding) => {
                                    setModalProps({
                                        open: true,
                                        title: t('bulk.title.removeAuthorization'),
                                        action: t('remove'),
                                        processing: t('removing'),
                                        resources: [clusterRoleBinding],
                                        description: t('bulk.message.removeAuthorization'),
                                        columns: columns,
                                        keyFn,
                                        actionFn: deleteResource,
                                        close: () => {
                                            refresh()
                                            setModalProps({ open: false })
                                        },
                                        isDanger: true,
                                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                                    })
                                },
                            },
                        ]}
                        emptyState={
                            <AcmEmptyState
                                key="accessEmptyState"
                                title={t('access.emptyTitle')}
                                message={
                                    <Trans i18nKey={'cluster:access.emptyMessage'} components={{ bold: <strong /> }} />
                                }
                                action={
                                    <AcmButton variant="primary" onClick={() => setAddModalOpen(true)}>
                                        {t('access.emptyStateButton')}
                                    </AcmButton>
                                }
                            />
                        }
                    />
                </AcmExpandableCard>
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
    const { t } = useTranslation(['cluster', 'common'])
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
        <AcmModal variant={ModalVariant.medium} title={t('access.add.title')} isOpen={props.isOpen} onClose={reset}>
            <AcmForm style={{ gap: 0 }}>
                <AcmAlertContext.Consumer>
                    {(alertContext) => (
                        <>
                            <div>{t('access.add.message')}</div>
                            &nbsp;
                            <div className={classes.container}>
                                <AcmSelect
                                    id="role"
                                    variant="typeahead"
                                    maxHeight="6em"
                                    isRequired
                                    label={t('access.add.userGroup')}
                                    placeholder={type === 'User' ? t('access.select.user') : t('access.select.group')}
                                    value={userGroup}
                                    onChange={(userGroup) => setUserGroup(userGroup)}
                                >
                                    {(type === 'User' ? filteredUsers : filteredGroups).map((item: User | Group) => (
                                        <SelectOption key={item.metadata.uid} value={item.metadata.name}>
                                            {item.metadata.name}
                                        </SelectOption>
                                    ))}
                                </AcmSelect>
                                <ToggleGroup>
                                    <ToggleGroupItem
                                        text={t('access.users')}
                                        buttonId="user"
                                        isSelected={type === 'User'}
                                        onChange={() => selectType('User')}
                                    />
                                    <ToggleGroupItem
                                        text={t('access.groups')}
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
                                label={t('access.add.role')}
                                placeholder={t('access.select.role')}
                                value={role}
                                onChange={(role) => setRole(role)}
                            >
                                {[
                                    {
                                        displayName: 'Cluster set admin',
                                        role: `open-cluster-management:managedclusterset:admin:${clusterSet!.metadata
                                            .name!}`,
                                    },
                                    {
                                        displayName: 'Cluster set view',
                                        role: `open-cluster-management:managedclusterset:view:${clusterSet!.metadata
                                            .name!}`,
                                    },
                                ].map((role) => (
                                    <SelectOption key={role.role} value={role.role} description={role.role}>
                                        {role.displayName}
                                    </SelectOption>
                                ))}
                            </AcmSelect>
                            <AcmAlertGroup isInline canClose padTop />
                            <ActionGroup>
                                <AcmSubmit
                                    id="add-access"
                                    variant="primary"
                                    label={t('common:add')}
                                    processingLabel={t('common:adding')}
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
                                    {t('common:cancel')}
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
    const { t } = useTranslation(['cluster', 'common'])

    if (!props.group) {
        return null
    }
    return (
        <div>
            <Popover headerContent={t('access.usersInGroup')} bodyContent={<AcmLabels labels={props.group.users} />}>
                <AcmButton
                    style={{ padding: props.useIcon ? 0 : undefined, paddingLeft: '4px' }}
                    variant={props.useIcon ? ButtonVariant.plain : ButtonVariant.link}
                    aria-label={t('access.usersInGroup.view')}
                >
                    {props.useIcon ? (
                        <OutlinedQuestionCircleIcon
                            style={{ width: '14px', fill: 'var(--pf-global--link--Color)', paddingTop: '2px' }}
                        />
                    ) : (
                        t('access.usersInGroup.view')
                    )}
                </AcmButton>
            </Popover>
        </div>
    )
}

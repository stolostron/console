/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterRoleBinding,
  ClusterRoleBindingKind,
  ClusterRoleKind,
  Group,
  isGlobalClusterSet,
  listClusterRoleBindings,
  listGroups,
  listUsers,
  RbacApiVersion,
  User,
} from '../../../../../../resources'
import { createResource, deleteResource, ResourceErrorCode } from '../../../../../../resources/utils'
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
} from '../../../../../../ui-components'
import { SelectVariant } from '../../../../../../components/AcmSelectBase'
import {
  ActionGroup,
  ButtonVariant,
  ModalVariant,
  PageSection,
  Popover,
  Split,
  SplitItem,
  ToggleGroup,
  ToggleGroupItem,
  SelectOption,
} from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../../../components/BulkActionModal'
import { ErrorPage, getErrorInfo } from '../../../../../../components/ErrorPage'
import { useQuery } from '../../../../../../lib/useQuery'
import { useClusterSetDetailsContext } from '../ClusterSetDetails'

export function ClusterSetAccessManagement() {
  const { t } = useTranslation()
  const { clusterSet } = useClusterSetDetailsContext()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ClusterRoleBinding> | { open: false }>({
    open: false,
  })
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false)

  const { data, refresh, error, startPolling, stopPolling } = useQuery(listClusterRoleBindings)
  const { data: users, startPolling: usersStartPolling, stopPolling: usersStopPolling } = useQuery(listUsers)
  const { data: groups, startPolling: groupsStartPolling, stopPolling: groupsStopPolling } = useQuery(listGroups)

  useEffect(() => {
    startPolling()
    usersStartPolling()
    groupsStartPolling()
    return () => {
      stopPolling()
      usersStopPolling()
      groupsStopPolling()
    }
  }, [groupsStartPolling, groupsStopPolling, startPolling, stopPolling, usersStartPolling, usersStopPolling])

  let clusterRoleBindings: ClusterRoleBinding[] | undefined
  if (data) {
    clusterRoleBindings = data.filter((item) => {
      const role = item.subjects ? item.roleRef.name : ''
      return (
        role.startsWith('open-cluster-management:managedclusterset:') && role.endsWith(`:${clusterSet.metadata.name}`)
      )
    })
  }

  function keyFn(item: ClusterRoleBinding) {
    return item.metadata.uid!
  }

  const columns = useMemo<IAcmTableColumn<ClusterRoleBinding>[]>(
    () => [
      {
        header: t('table.name'),
        sort: (a: ClusterRoleBinding, b: ClusterRoleBinding) => {
          const aValue = a.subjects?.[0]?.name ?? ''
          const bValue = b.subjects?.[0]?.name ?? ''
          return compareStrings(aValue, bValue)
        },
        search: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects?.[0].name ?? '',
        cell: (clusterRoleBinding: ClusterRoleBinding) => {
          if (clusterRoleBinding.subjects && clusterRoleBinding.subjects[0].kind === 'User') {
            return clusterRoleBinding.subjects[0].name
          } else {
            return (
              <span style={{ display: 'flex' }}>
                {clusterRoleBinding.subjects?.[0].name}{' '}
                <GroupUsersPopover
                  useIcon
                  group={groups?.find((group) => group.metadata.name === clusterRoleBinding.subjects?.[0].name)}
                />
              </span>
            )
          }
        },
      },
      {
        header: t('table.displayRole'),
        sort: 'roleRef.name',
        search: 'roleRef.name',
        cell: (clusterRoleBinding: ClusterRoleBinding) => {
          if (
            clusterRoleBinding.roleRef.name ===
            `open-cluster-management:managedclusterset:admin:${clusterSet && clusterSet.metadata.name}`
          ) {
            return t('access.clusterSet.role.admin')
          } else if (
            clusterRoleBinding.roleRef.name ===
            `open-cluster-management:managedclusterset:view:${clusterSet && clusterSet.metadata.name}`
          ) {
            return t('access.clusterSet.role.view')
          } else if (
            clusterRoleBinding.roleRef.name ===
            `open-cluster-management:managedclusterset:bind:${clusterSet && clusterSet.metadata.name}`
          ) {
            return t('Cluster set bind')
          }
          return '-'
        },
      },
      {
        header: t('table.clusterRole'),
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
        search: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects?.[0].kind ?? '',
        cell: (clusterRoleBinding: ClusterRoleBinding) => clusterRoleBinding.subjects?.[0].kind,
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
        <BulkActionModal<ClusterRoleBinding> {...modalProps} />
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
          items={clusterRoleBindings}
          keyFn={keyFn}
          columns={columns}
          tableActionButtons={[
            {
              id: 'addUserGroup',
              title: t('access.add'),
              click: () => setAddModalOpen(true),
              variant: ButtonVariant.primary,
            },
          ]}
          tableActions={[
            {
              id: 'removeAuthorization',
              title: t('access.remove'),
              click: (clusterRoleBindings: ClusterRoleBinding[]) => {
                setModalProps({
                  open: true,
                  title: t('bulk.title.removeAuthorization'),
                  action: t('remove'),
                  processing: t('removing'),
                  items: clusterRoleBindings,
                  emptyState: undefined, // table action is only enabled when items are selected,
                  description: t('bulk.message.removeAuthorization'),
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
              title: t('access.remove'),
              click: (clusterRoleBinding: ClusterRoleBinding) => {
                setModalProps({
                  open: true,
                  title: t('bulk.title.removeAuthorization'),
                  action: t('remove'),
                  processing: t('removing'),
                  items: [clusterRoleBinding],
                  emptyState: undefined, // there is always 1 item supplied
                  description: t('bulk.message.removeAuthorization'),
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
              title={t('access.emptyTitle')}
              message={<Trans i18nKey="access.emptyMessage" components={{ bold: <strong /> }} />}
              action={
                <AcmButton variant="primary" onClick={() => setAddModalOpen(true)}>
                  {t('access.emptyStateButton')}
                </AcmButton>
              }
            />
          }
        />
      </PageSection>
    </AcmPageContent>
  )
}

function AddUsersModal(props: {
  isOpen: boolean
  onClose: () => void
  clusterRoleBindings?: ClusterRoleBinding[]
  users?: User[]
  groups?: Group[]
}) {
  const { t } = useTranslation()
  const { clusterSet } = useClusterSetDetailsContext()
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
          (crb) => crb.subjects?.[0].kind === 'User' && crb.subjects[0].name === user.metadata.name
        )
    ) ?? []

  const filteredGroups: Group[] =
    props.groups?.filter(
      (group) =>
        !props.clusterRoleBindings?.find(
          (crb) => crb.subjects?.[0].kind === 'Group' && crb.subjects[0].name === group.metadata.name
        )
    ) ?? []

  const selectType = (type: 'User' | 'Group') => {
    setType(type)
    setUserGroup(undefined)
  }

  const roles = [
    {
      id: 'admin',
      displayName: t('access.clusterSet.role.admin'),
      role: `open-cluster-management:managedclusterset:admin:${clusterSet && clusterSet.metadata.name}`,
    },
    {
      id: 'view',
      displayName: t('access.clusterSet.role.view'),
      role: `open-cluster-management:managedclusterset:view:${clusterSet && clusterSet.metadata.name}`,
    },
    {
      id: 'bind',
      displayName: t('Cluster set bind'),
      role: `open-cluster-management:managedclusterset:bind:${clusterSet && clusterSet.metadata.name}`,
    },
  ]

  const getUserRoles = () => {
    return isGlobalClusterSet(clusterSet) ? roles.filter((userRole) => userRole.id !== 'admin') : roles
  }

  return (
    <AcmModal variant={ModalVariant.medium} title={t('access.add.title')} isOpen={props.isOpen} onClose={reset}>
      <AcmForm style={{ gap: 0 }}>
        <AcmAlertContext.Consumer>
          {(alertContext) => (
            <>
              <div>{t('access.add.message')}</div>
              &nbsp;
              <div>
                <div className="pf-v5-c-form__group-label">
                  <span className="pf-v5-c-form__label pf-v5-c-form__label-text">{t('access.add.userGroup')}</span>
                  <span className="pf-v5-c-form__label-required">*</span>
                </div>
                <Split hasGutter>
                  <SplitItem>
                    <ToggleGroup title="test">
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
                  </SplitItem>
                  <SplitItem isFilled>
                    <AcmSelect
                      id="role"
                      variant={SelectVariant.typeahead}
                      maxHeight="12em"
                      menuAppendTo="parent"
                      isRequired
                      label=""
                      placeholder={type === 'User' ? t('access.select.user') : t('access.select.group')}
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
                  </SplitItem>
                </Split>
              </div>
              {type === 'Group' && (
                <GroupUsersPopover group={filteredGroups.find((group) => group.metadata.name === userGroup)} />
              )}
              &nbsp;
              <AcmSelect
                id="role"
                maxHeight="12em"
                menuAppendTo="parent"
                isRequired
                label={t('access.add.role')}
                placeholder={t('access.select.role')}
                value={role}
                onChange={(role) => setRole(role)}
              >
                {clusterSet &&
                  getUserRoles().map((userRole) => (
                    <SelectOption key={userRole.role} value={userRole.role} description={userRole.role}>
                      {userRole.displayName}
                    </SelectOption>
                  ))}
              </AcmSelect>
              <AcmAlertGroup isInline canClose />
              <ActionGroup>
                <AcmSubmit
                  id="add-access"
                  variant="primary"
                  label={t('add')}
                  processingLabel={t('adding')}
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
                        alertContext.addAlert(getErrorInfo(err, t))
                      })
                  }}
                />
                <AcmButton key="cancel" variant="link" onClick={reset}>
                  {t('cancel')}
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
      <Popover
        headerContent={t('access.usersInGroup')}
        bodyContent={
          props.group.users && props.group.users.length > 0 ? (
            <AcmLabels labels={props.group.users} />
          ) : (
            t('No users in group')
          )
        }
      >
        <AcmButton
          style={{ padding: props.useIcon ? 0 : undefined, paddingLeft: '4px' }}
          variant={props.useIcon ? ButtonVariant.plain : ButtonVariant.link}
          aria-label={t('access.usersInGroup.view')}
        >
          {props.useIcon ? (
            <OutlinedQuestionCircleIcon
              style={{ width: '14px', fill: 'var(--pf-v5-global--link--Color)', paddingTop: '2px' }}
            />
          ) : (
            t('access.usersInGroup.view')
          )}
        </AcmButton>
      </Popover>
    </div>
  )
}

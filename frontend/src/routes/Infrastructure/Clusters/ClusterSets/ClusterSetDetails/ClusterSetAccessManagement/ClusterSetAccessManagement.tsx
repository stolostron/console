/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { ActionGroup, ButtonVariant, PageSection, Popover, SelectOption } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useEffect, useMemo, useState } from 'react'
import { BulkActionModal, BulkActionModalProps, errorIsNot } from '../../../../../../components/BulkActionModal'
import { ErrorPage, getErrorInfo } from '../../../../../../components/ErrorPage'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { useQuery } from '../../../../../../lib/useQuery'
import {
  ClusterRoleBinding,
  ClusterRoleBindingKind,
  ClusterRoleKind,
  Group,
  isGlobalClusterSet,
  listClusterRoleBindings,
  listGroups,
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
import { IdentitiesList } from '../../../../../../components/rbac/IdentitiesList'
import { useClusterSetDetailsContext } from '../ClusterSetDetails'

const addAccessModalIdentitiesClass = css({
  '& .pf-v5-c-table, & .pf-v6-c-table': {
    backgroundColor: 'inherit',
    color: 'inherit',
  },
  '& .pf-v6-c-pagination.pf-m-bottom': {
    backgroundColor: 'inherit',
  },
})

export function ClusterSetAccessManagement() {
  const { t } = useTranslation()
  const { clusterSet } = useClusterSetDetailsContext()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ClusterRoleBinding> | { open: false }>({
    open: false,
  })
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false)

  const { data, refresh, error, startPolling, stopPolling } = useQuery(listClusterRoleBindings)
  const { data: groups, startPolling: groupsStartPolling, stopPolling: groupsStopPolling } = useQuery(listGroups)

  useEffect(() => {
    startPolling()
    groupsStartPolling()
    return () => {
      stopPolling()
      groupsStopPolling()
    }
  }, [groupsStartPolling, groupsStopPolling, startPolling, stopPolling])

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
      <PageSection hasBodyWrapper={false}>
        <BulkActionModal<ClusterRoleBinding> {...modalProps} />
        <AddUsersModal
          isOpen={addModalOpen}
          onClose={() => {
            refresh()
            setAddModalOpen(false)
          }}
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
              title={t("You don't have any users or groups yet")}
              message={t('To get started, add a user or group to this cluster set.')}
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

function AddUsersModal(props: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { clusterSet } = useClusterSetDetailsContext()
  const [selectedIdentity, setSelectedIdentity] = useState<{ kind: 'User' | 'Group'; name: string } | undefined>()
  const [role, setRole] = useState<string | undefined>()

  const reset = () => {
    setSelectedIdentity(undefined)
    setRole(undefined)
    props.onClose()
  }

  const handleUserSelect = (user: User) => {
    setSelectedIdentity({ kind: 'User', name: user.metadata.name! })
  }

  const handleGroupSelect = (group: Group) => {
    setSelectedIdentity({ kind: 'Group', name: group.metadata.name! })
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
    <AcmModal variant={ModalVariant.large} title={t('access.add.title')} isOpen={props.isOpen} onClose={reset}>
      <AcmForm style={{ gap: 0 }}>
        <AcmAlertContext.Consumer>
          {(alertContext) => (
            <>
              <div className={addAccessModalIdentitiesClass}>
                <IdentitiesList
                  onUserSelect={handleUserSelect}
                  onGroupSelect={handleGroupSelect}
                  initialSelectedIdentity={selectedIdentity}
                />
              </div>
              <AcmSelect
                id="role"
                maxHeight="12em"
                menuAppendTo="parent"
                isRequired
                label={t('access.add.role')}
                placeholder={t('access.select.role')}
                value={role}
                onChange={(role) => setRole(role)}
                style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }}
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
                  isDisabled={!selectedIdentity || !role}
                  onClick={() => {
                    if (selectedIdentity && role) {
                      alertContext.clearAlerts()
                      const resource: ClusterRoleBinding = {
                        apiVersion: RbacApiVersion,
                        kind: ClusterRoleBindingKind,
                        metadata: {
                          generateName: `${clusterSet?.metadata.name}-`,
                        },
                        subjects: [
                          {
                            kind: selectedIdentity.kind,
                            apiGroup: 'rbac.authorization.k8s.io',
                            name: selectedIdentity.name,
                          },
                        ],
                        roleRef: {
                          apiGroup: 'rbac.authorization.k8s.io',
                          kind: ClusterRoleKind,
                          name: role,
                        },
                      }
                      return createResource(resource)
                        .promise.then(() => reset())
                        .catch((err) => {
                          alertContext.addAlert(getErrorInfo(err, t))
                        })
                    }
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
              style={{
                width: '14px',
                fill: 'var(--pf-t--global--text--color--link--default)',
                paddingTop: '2px',
              }}
            />
          ) : (
            t('access.usersInGroup.view')
          )}
        </AcmButton>
      </Popover>
    </div>
  )
}

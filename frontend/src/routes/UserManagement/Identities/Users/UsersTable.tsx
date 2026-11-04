/* Copyright Contributors to the Open Cluster Management project */
import { ComponentProps, useCallback, useMemo, useRef, useState } from 'react'
import { AcmButton, AcmEmptyState, AcmTable, compareStrings, IAcmTableButtonAction } from '~/ui-components'
import { IRequestListView, IResultStatuses } from '../../../../lib/useAggregates'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { User } from '../../../../resources/rbac'
import { useFilters, usersTableColumns } from '../IdentityTableHelper'
import { preferSearchBackedUsers, useMraUserSubjects, useUsersSearch } from './useUsersSearch'

interface UsersTableProps {
  hiddenColumns?: string[]
  areLinksDisplayed?: boolean
  selectedUser?: User
  setSelectedUser?: (user: User) => void
  additionalUsers?: User[]
  /** When set, render hub Users from listUsers() and skip Search. */
  users?: User[]
  usersLoading?: boolean
  usersError?: Error
  isCreateButtonDisplayed?: boolean
  createButtonText?: string
  onCreateClick?: () => void
  tableActionButtons?: IAcmTableButtonAction[]
}

type UsersAcmTableProps = Omit<ComponentProps<typeof AcmTable<User>>, 'aria-label' | 'keyFn' | 'emptyState'> & {
  tableKey: string
  emptyStateError?: Error
  isCreateButtonDisplayed?: boolean
  createButtonText?: string
  onCreateClick?: () => void
}

const userKeyFn = (user: User) => user.metadata.name ?? ''

const UsersTableEmptyState = ({
  error,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
}: {
  error?: Error
  isCreateButtonDisplayed?: boolean
  createButtonText?: string
  onCreateClick?: () => void
}) => {
  const { t } = useTranslation()

  if (error) {
    return <AcmEmptyState title={t('Error')} message={error.message} />
  }

  return (
    <AcmEmptyState
      title={t(`In order to view Users, add Identity provider`)}
      message={
        <Trans
          i18nKey="Once Identity provider is added, Users will appear in the list after they log in."
          components={{ bold: <strong /> }}
        />
      }
      action={
        <div>
          {isCreateButtonDisplayed && onCreateClick && (
            <AcmButton variant="primary" onClick={onCreateClick}>
              {createButtonText ?? t('Create user')}
            </AcmButton>
          )}
          <ViewDocumentationLink doclink={DOC_LINKS.IDENTITY_PROVIDER_CONFIGURATION} />
        </div>
      }
    />
  )
}

const UsersAcmTable = ({
  tableKey,
  emptyStateError,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
  ...tableProps
}: UsersAcmTableProps) => {
  const { t } = useTranslation()

  return (
    <AcmTable<User>
      aria-label={t('Users table')}
      key={tableKey}
      keyFn={userKeyFn}
      emptyState={
        <UsersTableEmptyState
          error={emptyStateError}
          isCreateButtonDisplayed={isCreateButtonDisplayed}
          createButtonText={createButtonText}
          onCreateClick={onCreateClick}
        />
      }
      {...tableProps}
    />
  )
}

const UsersTable = (props: UsersTableProps) => {
  if (props.users !== undefined) {
    return <UsersTableFromList {...props} users={props.users} />
  }
  return <UsersTableFromSearch {...props} />
}

const UsersTableFromList = ({
  hiddenColumns,
  areLinksDisplayed = true,
  selectedUser,
  setSelectedUser,
  additionalUsers,
  users,
  usersLoading = false,
  usersError,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
  tableActionButtons,
}: UsersTableProps & { users: User[] }) => {
  const { t } = useTranslation()
  const mraUsers = useMraUserSubjects()

  const mergedUsers = useMemo(() => {
    return preferSearchBackedUsers([...users, ...(additionalUsers ?? []), ...mraUsers]).toSorted((a, b) =>
      compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')
    )
  }, [additionalUsers, mraUsers, users])

  const handleRadioSelect = useCallback(
    (uid: string) => {
      const user = uid ? mergedUsers.find((item) => item.metadata.uid === uid) : undefined
      if (user) setSelectedUser?.(user)
    },
    [mergedUsers, setSelectedUser]
  )

  const filters = useFilters('user', mergedUsers)
  const columns = useMemo(
    () =>
      usersTableColumns({
        t,
        hiddenColumns,
        onRadioSelect: setSelectedUser ? handleRadioSelect : () => {},
        areLinksDisplayed,
        selectedIdentity: selectedUser,
      }),
    [areLinksDisplayed, handleRadioSelect, hiddenColumns, selectedUser, setSelectedUser, t]
  )

  return (
    <UsersAcmTable
      tableKey="users-table-hub"
      filters={filters}
      columns={columns}
      items={usersLoading ? undefined : mergedUsers}
      tableActionButtons={tableActionButtons}
      resultView={{
        page: 1,
        loading: usersLoading,
        refresh: () => {},
        items: [],
        emptyResult: false,
        processedItemCount: 0,
        isPreProcessed: false,
      }}
      emptyStateError={usersError}
      isCreateButtonDisplayed={isCreateButtonDisplayed}
      createButtonText={createButtonText}
      onCreateClick={onCreateClick}
    />
  )
}

const UsersTableFromSearch = ({
  hiddenColumns,
  areLinksDisplayed = true,
  selectedUser,
  setSelectedUser,
  additionalUsers,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
  tableActionButtons,
}: UsersTableProps) => {
  const { t } = useTranslation()
  const [request, setRequest] = useState<IRequestListView>()

  const columnsForSearch = useMemo(
    () =>
      usersTableColumns({
        t,
        hiddenColumns,
        onRadioSelect: () => {},
        areLinksDisplayed,
        selectedIdentity: selectedUser,
      }),
    [areLinksDisplayed, hiddenColumns, selectedUser, t]
  )

  const { users, processedItemCount, loading, error, refetch, fetchExport, emptyResult } = useUsersSearch({
    request,
    columns: columnsForSearch,
    additionalUsers,
  })

  const usersRef = useRef(users)
  usersRef.current = users

  const selectUser = useCallback(
    (uid: string) => {
      const user = uid ? usersRef.current.find((item) => item.metadata.uid === uid) : undefined
      if (user) setSelectedUser?.(user)
    },
    [setSelectedUser]
  )

  const columns = useMemo(
    () =>
      usersTableColumns({
        t,
        hiddenColumns,
        onRadioSelect: setSelectedUser ? selectUser : () => {},
        areLinksDisplayed,
        selectedIdentity: selectedUser,
      }),
    [areLinksDisplayed, hiddenColumns, selectUser, selectedUser, setSelectedUser, t]
  )

  const resultCounts = useMemo<IResultStatuses>(
    () => ({
      itemCount: processedItemCount,
      filterCounts: undefined,
      systemAppNSPrefixes: [],
      loading,
      refresh: refetch,
    }),
    [loading, processedItemCount, refetch]
  )

  return (
    <UsersAcmTable
      tableKey="users-table"
      columns={columns}
      items={users}
      tableActionButtons={tableActionButtons}
      setRequestView={setRequest}
      fetchExport={fetchExport}
      exportFilePrefix="users"
      resultCounts={resultCounts}
      resultView={{
        page: request?.page ?? 1,
        loading,
        refresh: refetch,
        items: [],
        emptyResult,
        processedItemCount,
        isPreProcessed: true,
      }}
      emptyStateError={error}
      isCreateButtonDisplayed={isCreateButtonDisplayed}
      createButtonText={createButtonText}
      onCreateClick={onCreateClick}
    />
  )
}

export { UsersTable }

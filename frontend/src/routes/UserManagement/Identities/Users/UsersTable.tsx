/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useMemo, useRef, useState } from 'react'
import { AcmButton, AcmEmptyState, AcmTable, IAcmTableButtonAction } from '~/ui-components'
import { IRequestListView, IResultStatuses } from '../../../../lib/useAggregates'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { User } from '../../../../resources/rbac'
import { usersTableColumns } from '../IdentityTableHelper'
import { useUsersSearch } from './useUsersSearch'

interface UsersTableProps {
  hiddenColumns?: string[]
  areLinksDisplayed?: boolean
  selectedUser?: User
  setSelectedUser?: (user: User) => void
  additionalUsers?: User[]
  isCreateButtonDisplayed?: boolean
  createButtonText?: string
  onCreateClick?: () => void
  tableActionButtons?: IAcmTableButtonAction[]
}

const UsersTable = ({
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

  const keyFn = useCallback((user: User) => user.metadata.name ?? '', [])

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
    <AcmTable<User>
      aria-label={t('Users table')}
      key="users-table"
      columns={columns}
      keyFn={keyFn}
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
      emptyState={
        error ? (
          <AcmEmptyState title={t('Error')} message={error.message} />
        ) : (
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
    />
  )
}

export { UsersTable }

/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { User } from '../../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmEmptyState, AcmTable, compareStrings } from '../../../../ui-components'
import { useFilters, usersTableColumns } from '../IdentityTableHelper'

interface UsersTableProps {
  hiddenColumns?: string[]
  areLinksDisplayed?: boolean
  selectedUser?: User
  setSelectedUser?: (user: User) => void
}

const UsersTable = ({ hiddenColumns, areLinksDisplayed = true, selectedUser, setSelectedUser }: UsersTableProps) => {
  const { t } = useTranslation()
  const { usersState } = useSharedAtoms()
  const rbacUsers = useRecoilValue(usersState)
  const users = useMemo(() => {
    return rbacUsers?.toSorted((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? []
  }, [rbacUsers])

  const handleRadioSelect = useCallback(
    (uid: string) => {
      const user = uid ? users.find((user) => user.metadata.uid === uid) : undefined
      if (user) {
        setSelectedUser?.(user)
      }
    },
    [users, setSelectedUser]
  )

  const keyFn = useCallback((user: User) => user.metadata.name ?? '', [])

  const filters = useFilters('user', users)
  const columns = useMemo(
    () =>
      usersTableColumns({
        t,
        hiddenColumns,
        onRadioSelect: handleRadioSelect,
        areLinksDisplayed,
        selectedIdentity: selectedUser,
      }),
    [areLinksDisplayed, handleRadioSelect, hiddenColumns, selectedUser, t]
  )

  return (
    <AcmTable<User>
      key="users-table"
      filters={filters}
      columns={columns}
      keyFn={keyFn}
      items={users}
      resultView={{
        page: 1,
        loading: false,
        refresh: () => {},
        items: [],
        emptyResult: false,
        processedItemCount: 0,
        isPreProcessed: false,
      }}
      emptyState={
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
              <ViewDocumentationLink doclink={DOC_LINKS.IDENTITY_PROVIDER_CONFIGURATION} />
            </div>
          }
        />
      }
    />
  )
}

export { UsersTable }

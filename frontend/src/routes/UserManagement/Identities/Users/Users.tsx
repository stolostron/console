/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { cellWidth } from '@patternfly/react-table'
import { useMemo, useCallback } from 'react'
import { generatePath, Link, useNavigate } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../../components/HighlightSearchText'
import { useTranslation } from '../../../lib/acm-i18next'

import { NavigationPath } from '../../../NavigationPath'
import { listUsers, User as RbacUser } from '../../../resources/rbac'
import { useQuery } from '../../../lib/useQuery'
import { AcmEmptyState, AcmTable, compareStrings, IAcmRowAction, IAcmTableColumn } from '../../../ui-components'
import AcmTimestamp from '../../../lib/AcmTimestamp'
import { getISOStringTimestamp } from '../../../resources/utils'

const Users = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: rbacUsers } = useQuery(listUsers)

  const users = useMemo(() => {
    if (!rbacUsers) return []

    return rbacUsers.sort((a, b) => compareStrings(a.metadata.name || '', b.metadata.name || ''))
  }, [rbacUsers])

  const keyFn = useCallback((user: RbacUser) => user.metadata.name || '', [])

  const columns = useMemo<IAcmTableColumn<RbacUser>[]>(
    () => [
      {
        header: t('Name'),
        sort: 'metadata.name',
        search: 'metadata.name',
        transforms: [cellWidth(40)],
        cell: (user, search) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            <Link to={generatePath(NavigationPath.identitiesUsersDetails, { id: user.metadata.name || '' })}>
              <HighlightSearchText text={user.metadata.name || ''} searchText={search} isTruncate />
            </Link>
          </span>
        ),
        exportContent: (user) => user.metadata.name || '',
      },
      {
        header: t('Status'),
        cell: () => <span>{t('Active')}</span>,
        transforms: [cellWidth(20)],
        exportContent: () => 'Active',
      },
      {
        header: t('Created'),
        cell: (user) => {
          return user.metadata.creationTimestamp ? (
            <span style={{ whiteSpace: 'nowrap' }}>
              <AcmTimestamp timestamp={user.metadata.creationTimestamp} />
            </span>
          ) : (
            '-'
          )
        },
        transforms: [cellWidth(40)],
        sort: 'metadata.creationTimestamp',
        exportContent: (user) => {
          return user.metadata.creationTimestamp ? getISOStringTimestamp(user.metadata.creationTimestamp) : ''
        },
      },
    ],
    [t]
  )

  const rowActionResolver = useCallback(
    (user: RbacUser): IAcmRowAction<RbacUser>[] => {
      const actions: IAcmRowAction<RbacUser>[] = [
        {
          id: 'details',
          title: t('Details'),
          click: () => {
            navigate(generatePath(NavigationPath.identitiesUsersDetails, { id: user.metadata.name || '' }))
          },
        },
      ]

      return actions
    },
    [t, navigate]
  )

  return (
    <PageSection>
      <AcmTable<RbacUser>
        key="users-table"
        columns={columns}
        keyFn={keyFn}
        items={users}
        emptyState={<AcmEmptyState key="usersEmptyState" title={t("You don't have any users")} />}
        rowActionResolver={rowActionResolver}
      />
    </PageSection>
  )
}

export { Users }

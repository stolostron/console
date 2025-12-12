/* Copyright Contributors to the Open Cluster Management project */
import { Radio } from '@patternfly/react-core'
import { cellWidth } from '@patternfly/react-table'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../../components/HighlightSearchText'
import AcmTimestamp from '../../../lib/AcmTimestamp'
import { NavigationPath } from '../../../NavigationPath'
import { Group, User } from '../../../resources/rbac'
import { getISOStringTimestamp } from '../../../resources/utils'
import { IAcmTableColumn } from '../../../ui-components/AcmTable/AcmTableTypes'
import { IdentityStatus } from '../../../ui-components/IdentityStatus/IdentityStatus'

const EXPORT_FILE_PREFIX = 'identity-table'

export type IdentityItem = User | Group
export type IdentityType = 'user' | 'group'

const isUser = (identity: IdentityItem): identity is User => identity.kind === 'User'
const isGroup = (identity: IdentityItem): identity is Group => identity.kind === 'Group'

type IdentityTableHelperProps = {
  t: TFunction
}

const COLUMN_CELLS = {
  USER_NAME: (user: User, search: string, areLinksDisplayed: boolean) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      {areLinksDisplayed ? (
        <Link to={generatePath(NavigationPath.identitiesUsersDetails, { id: user.metadata.uid ?? '' })}>
          <HighlightSearchText text={user.metadata.name ?? ''} searchText={search} useFuzzyHighlighting />
        </Link>
      ) : (
        <HighlightSearchText text={user.metadata.name ?? ''} searchText={search} useFuzzyHighlighting />
      )}
    </span>
  ),
  GROUP_NAME: (group: Group, search: string, areLinksDisplayed: boolean) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      {areLinksDisplayed ? (
        <Link to={generatePath(NavigationPath.identitiesGroupsDetails, { id: group.metadata.uid ?? '' })}>
          <HighlightSearchText text={group.metadata.name ?? ''} searchText={search} />
        </Link>
      ) : (
        <HighlightSearchText text={group.metadata.name ?? ''} searchText={search} />
      )}
    </span>
  ),
  USER_IDENTITY_PROVIDER: (user: User) =>
    user.identities ? <span style={{ whiteSpace: 'nowrap' }}>{user.identities}</span> : '-',
  GROUP_USERS: (group: Group) =>
    group.users ? <span style={{ whiteSpace: 'nowrap' }}>{group.users.length}</span> : '-',
  STATUS: (identity: IdentityItem) => <IdentityStatus identity={identity} />,
  CREATED: (identity: IdentityItem) => {
    return identity.metadata.creationTimestamp ? (
      <span style={{ whiteSpace: 'nowrap' }}>
        <AcmTimestamp timestamp={identity.metadata.creationTimestamp} />
      </span>
    ) : (
      '-'
    )
  },
}

export const getIdentityTableColumns = ({
  t,
  hiddenColumns,
  onRadioSelect,
  areLinksDisplayed,
  selectedIdentity,
}: Pick<IdentityTableHelperProps, 't'> & {
  hiddenColumns?: string[]
  onRadioSelect: (identityUid: string) => void
  areLinksDisplayed: boolean
  selectedIdentity?: IdentityItem
}): IAcmTableColumn<IdentityItem>[] => {
  const columns: IAcmTableColumn<IdentityItem>[] = []

  columns.push({
    id: 'radio',
    header: ' ',
    transforms: [cellWidth(10)],
    cell: (identity) => (
      <Radio
        id={`radio-${identity.metadata.uid}`}
        name={`radio-${identity.metadata.uid}`}
        key={`radio-${identity.metadata.uid}`}
        value={identity.metadata.uid}
        isChecked={selectedIdentity?.metadata.uid === identity.metadata.uid}
        onChange={() => onRadioSelect(identity.metadata.uid ?? '')}
        aria-label={`Select ${identity.metadata.name}`}
      />
    ),
    isHidden: hiddenColumns?.includes('radio'),
  })

  columns.push(
    {
      id: 'name',
      header: t('Name'),
      sort: 'metadata.name',
      search: 'metadata.name',
      transforms: [cellWidth(50)],
      cell: (identity, search) => {
        if (isUser(identity)) {
          return COLUMN_CELLS.USER_NAME(identity, search, areLinksDisplayed)
        }
        return COLUMN_CELLS.GROUP_NAME(identity, search, areLinksDisplayed)
      },
      exportContent: (identity) => identity.metadata.name ?? '',
      isHidden: hiddenColumns?.includes('name'),
      isDefault: true,
      isFirstVisitChecked: true,
    },
    {
      id: 'identity-provider',
      header: t('Identity provider'),
      sort: 'identities',
      cell: (identity) => {
        if (isUser(identity)) {
          return COLUMN_CELLS.USER_IDENTITY_PROVIDER(identity)
        }
        return null
      },
      isHidden: hiddenColumns?.includes('identity-provider'),
      isDefault: true,
      isFirstVisitChecked: true,
    },
    {
      id: 'users',
      header: t('Users'),
      sort: 'users.length',
      cell: (identity) => {
        if (isGroup(identity)) {
          return COLUMN_CELLS.GROUP_USERS(identity)
        }
        return null
      },
      isHidden: hiddenColumns?.includes('users'),
      isDefault: true,
      isFirstVisitChecked: true,
    },
    {
      id: 'created',
      header: t('Created'),
      cell: (identity) => COLUMN_CELLS.CREATED(identity),
      sort: 'metadata.creationTimestamp',
      exportContent: (identity) =>
        identity.metadata.creationTimestamp ? getISOStringTimestamp(identity.metadata.creationTimestamp) : '',
      isHidden: hiddenColumns?.includes('created'),
      isDefault: true,
      isFirstVisitChecked: true,
    }
  )

  return columns
}

const identityProviderFilter = (selection: string[], user: User): boolean => {
  if (selection.length === 0) return true

  const hasMatchingIdentity = user.identities?.some((identity: string) => {
    const provider = identity.split(':')[0]
    return selection.includes(provider)
  })

  return hasMatchingIdentity ?? false
}

export const useIdentityFilters = (type: IdentityType, identities: IdentityItem[] = []) => {
  return useMemo(() => {
    const filters = [
      {
        id: 'name',
        label: type === 'user' ? 'User Name' : 'Group Name',
        tableFilterFn: (selectedValues: string[], identity: IdentityItem) => {
          if (selectedValues.length === 0) return true

          const identityName = identity.metadata.name || ''
          return selectedValues.some((selectedValue) =>
            identityName.toLowerCase().includes(selectedValue.toLowerCase())
          )
        },
        options: identities
          .map((identity) => identity.metadata.name)
          .filter((name): name is string => name !== undefined && name !== null && name.trim() !== '')
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ label: name, value: name })),
      },
    ]

    if (type === 'user') {
      const users = identities as User[]
      const identityProviders = new Set<string>()
      for (const user of users) {
        for (const identity of user.identities || []) {
          const provider = identity.split(':')[0]
          if (provider) {
            identityProviders.add(provider)
          }
        }
      }

      const identityProviderOptions = Array.from(identityProviders)
        .sort((a, b) => a.localeCompare(b))
        .map((provider) => ({ label: provider, value: provider }))

      filters.push({
        id: 'identity-provider',
        label: 'Identity Provider',
        tableFilterFn: (selectedValues: string[], identity: IdentityItem) => {
          return identityProviderFilter(selectedValues, identity as User)
        },
        options: identityProviderOptions,
      })
    }

    return filters
  }, [identities, type])
}

export const usersTableColumns = ({
  t,
  hiddenColumns,
  onRadioSelect,
  areLinksDisplayed,
  selectedIdentity,
}: {
  t: TFunction
  hiddenColumns?: string[]
  onRadioSelect: (identityUid: string) => void
  areLinksDisplayed: boolean
  selectedIdentity?: IdentityItem
}) =>
  getIdentityTableColumns({
    t,
    hiddenColumns: [...(hiddenColumns || []), 'users'],
    onRadioSelect,
    areLinksDisplayed,
    selectedIdentity,
  })

export const groupsTableColumns = ({
  t,
  hiddenColumns,
  onRadioSelect,
  areLinksDisplayed,
  selectedIdentity,
}: {
  t: TFunction
  hiddenColumns?: string[]
  onRadioSelect: (identityUid: string) => void
  areLinksDisplayed: boolean
  selectedIdentity?: IdentityItem
}) =>
  getIdentityTableColumns({
    t,
    hiddenColumns: [...(hiddenColumns || []), 'identity-provider'],
    onRadioSelect,
    areLinksDisplayed,
    selectedIdentity,
  })

export const useFilters = (type: IdentityType, identities: IdentityItem[] = []) => useIdentityFilters(type, identities)

export { COLUMN_CELLS, EXPORT_FILE_PREFIX }

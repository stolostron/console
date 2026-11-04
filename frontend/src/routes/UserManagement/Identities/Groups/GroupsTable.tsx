/* Copyright Contributors to the Open Cluster Management project */
import { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AcmAlert, AcmButton, AcmEmptyState, AcmTable, compareStrings, IAcmTableButtonAction } from '~/ui-components'
import { IRequestListView, IResultStatuses } from '../../../../lib/useAggregates'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { Group } from '../../../../resources/rbac'
import { groupsTableColumns, useFilters } from '../IdentityTableHelper'
import { isSearchBackedGroup, preferSearchBackedGroups, useGroupsSearch, useMraGroupSubjects } from './useGroupsSearch'

interface GroupsTableCommonProps {
  hiddenColumns?: string[]
  areLinksDisplayed?: boolean
  selectedGroup?: Group
  setSelectedGroup?: (group: Group) => void
  additionalGroups?: Group[]
  isCreateButtonDisplayed?: boolean
  createButtonText?: string
  onCreateClick?: () => void
  tableActionButtons?: IAcmTableButtonAction[]
}

interface GroupsTableHubProps {
  /** Hub Groups from listGroups(). When set, skip Search. */
  groups: Group[]
  groupsLoading?: boolean
  groupsError?: Error
}

type GroupsTableProps = GroupsTableCommonProps & Partial<GroupsTableHubProps>

type GroupsAcmTableProps = Omit<ComponentProps<typeof AcmTable<Group>>, 'aria-label' | 'keyFn' | 'emptyState'> & {
  tableKey: string
  emptyStateError?: Error
  isCreateButtonDisplayed?: boolean
  createButtonText?: string
  onCreateClick?: () => void
}

const groupKeyFn = (group: Group) => group.metadata.name ?? ''

const GroupsTableEmptyState = ({
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
      title={t(`In order to view Groups, add Identity provider`)}
      message={
        <Trans
          i18nKey="Once Identity provider is added, Groups will appear in the list after they log in."
          components={{ bold: <strong /> }}
        />
      }
      action={
        <div>
          {isCreateButtonDisplayed && onCreateClick && (
            <AcmButton variant="primary" onClick={onCreateClick}>
              {createButtonText ?? t('Create group')}
            </AcmButton>
          )}
          <ViewDocumentationLink doclink={DOC_LINKS.IDENTITY_PROVIDER_CONFIGURATION} />
        </div>
      }
    />
  )
}

const GroupsAcmTable = ({
  tableKey,
  emptyStateError,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
  ...tableProps
}: GroupsAcmTableProps) => {
  const { t } = useTranslation()

  return (
    <AcmTable<Group>
      aria-label={t('Groups table')}
      key={tableKey}
      keyFn={groupKeyFn}
      emptyState={
        <GroupsTableEmptyState
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

const GroupsTable = (props: Readonly<GroupsTableProps>) => {
  const { groups, groupsLoading, groupsError, ...tableProps } = props
  if (groups !== undefined) {
    return (
      <GroupsTableFromList {...tableProps} groups={groups} groupsLoading={groupsLoading} groupsError={groupsError} />
    )
  }
  return <GroupsTableFromSearch {...tableProps} />
}

const GroupsTableFromList = ({
  hiddenColumns,
  areLinksDisplayed = true,
  selectedGroup,
  setSelectedGroup,
  additionalGroups,
  groups,
  groupsLoading = false,
  groupsError,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
  tableActionButtons,
}: Readonly<GroupsTableCommonProps & GroupsTableHubProps>) => {
  const { t } = useTranslation()
  const mraGroups = useMraGroupSubjects()

  const mergedGroups = useMemo(() => {
    return preferSearchBackedGroups([...groups, ...(additionalGroups ?? []), ...mraGroups]).toSorted((a, b) =>
      compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')
    )
  }, [additionalGroups, groups, mraGroups])

  // Upgrade a selected MRA stub to the preferred hub Group when listGroups catches up.
  // Leave an unrelated selection alone.
  useEffect(() => {
    if (!selectedGroup || !setSelectedGroup || isSearchBackedGroup(selectedGroup)) return
    const preferred = mergedGroups.find((group) => group.metadata.name === selectedGroup.metadata.name)
    if (preferred && isSearchBackedGroup(preferred) && preferred.metadata.uid !== selectedGroup.metadata.uid) {
      setSelectedGroup(preferred)
    }
  }, [mergedGroups, selectedGroup, setSelectedGroup])

  const handleRadioSelect = useCallback(
    (uid: string) => {
      const group = uid ? mergedGroups.find((item) => item.metadata.uid === uid) : undefined
      if (group) setSelectedGroup?.(group)
    },
    [mergedGroups, setSelectedGroup]
  )

  const filters = useFilters('group', mergedGroups)
  const columns = useMemo(
    () =>
      groupsTableColumns({
        t,
        hiddenColumns,
        onRadioSelect: setSelectedGroup ? handleRadioSelect : () => {},
        areLinksDisplayed,
        selectedIdentity: selectedGroup,
      }),
    [areLinksDisplayed, handleRadioSelect, hiddenColumns, selectedGroup, setSelectedGroup, t]
  )

  // emptyStateError only appears when the table has no rows; show an inline alert
  // when cached/MRA rows remain after a listGroups failure (e.g. transient poll error).
  const showGroupsErrorAlert = Boolean(groupsError) && !groupsLoading && mergedGroups.length > 0

  return (
    <>
      {showGroupsErrorAlert && groupsError && (
        <AcmAlert isInline noClose variant="danger" title={t('Error')} message={groupsError.message} />
      )}
      <GroupsAcmTable
        tableKey="groups-table-hub"
        filters={filters}
        columns={columns}
        items={groupsLoading ? undefined : mergedGroups}
        tableActionButtons={tableActionButtons}
        resultView={{
          page: 1,
          loading: groupsLoading,
          refresh: () => {},
          items: [],
          emptyResult: false,
          processedItemCount: 0,
          isPreProcessed: false,
        }}
        emptyStateError={groupsError}
        isCreateButtonDisplayed={isCreateButtonDisplayed}
        createButtonText={createButtonText}
        onCreateClick={onCreateClick}
      />
    </>
  )
}

const GroupsTableFromSearch = ({
  hiddenColumns,
  areLinksDisplayed = true,
  selectedGroup,
  setSelectedGroup,
  additionalGroups,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
  tableActionButtons,
}: Readonly<GroupsTableCommonProps>) => {
  const { t } = useTranslation()
  const [request, setRequest] = useState<IRequestListView>()

  const columnsForSearch = useMemo(
    () =>
      groupsTableColumns({
        t,
        hiddenColumns,
        onRadioSelect: () => {},
        areLinksDisplayed,
        selectedIdentity: selectedGroup,
      }),
    [areLinksDisplayed, hiddenColumns, selectedGroup, t]
  )

  const { groups, processedItemCount, loading, error, refetch, fetchExport, emptyResult } = useGroupsSearch({
    request,
    columns: columnsForSearch,
    additionalGroups,
  })

  const groupsRef = useRef(groups)
  groupsRef.current = groups

  const selectGroup = useCallback(
    (uid: string) => {
      const group = uid ? groupsRef.current.find((item) => item.metadata.uid === uid) : undefined
      if (group) setSelectedGroup?.(group)
    },
    [setSelectedGroup]
  )

  const columns = useMemo(
    () =>
      groupsTableColumns({
        t,
        hiddenColumns,
        onRadioSelect: setSelectedGroup ? selectGroup : () => {},
        areLinksDisplayed,
        selectedIdentity: selectedGroup,
      }),
    [areLinksDisplayed, hiddenColumns, selectGroup, selectedGroup, setSelectedGroup, t]
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
    <GroupsAcmTable
      tableKey="groups-table"
      columns={columns}
      items={groups}
      tableActionButtons={tableActionButtons}
      setRequestView={setRequest}
      fetchExport={fetchExport}
      exportFilePrefix="groups"
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

export { GroupsTable }

/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useMemo, useRef, useState } from 'react'
import { AcmButton, AcmEmptyState, AcmTable, IAcmTableButtonAction } from '~/ui-components'
import { IRequestListView, IResultStatuses } from '../../../../lib/useAggregates'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { Group } from '../../../../resources/rbac'
import { groupsTableColumns } from '../IdentityTableHelper'
import { useGroupsSearch } from './useGroupsSearch'

interface GroupsTableProps {
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

const GroupsTable = ({
  hiddenColumns,
  areLinksDisplayed = true,
  selectedGroup,
  setSelectedGroup,
  additionalGroups,
  isCreateButtonDisplayed,
  createButtonText,
  onCreateClick,
  tableActionButtons,
}: GroupsTableProps) => {
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

  const keyFn = useCallback((group: Group) => group.metadata.name ?? '', [])

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
    <AcmTable<Group>
      aria-label={t('Groups table')}
      key="groups-table"
      columns={columns}
      keyFn={keyFn}
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
      emptyState={
        error ? (
          <AcmEmptyState title={t('Error')} message={error.message} />
        ) : (
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
    />
  )
}

export { GroupsTable }

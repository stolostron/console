/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { Group } from '../../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmEmptyState, AcmTable, AcmTableStateProvider, compareStrings } from '../../../../ui-components'
import { groupsTableColumns, useFilters } from '../IdentityTableHelper'

interface GroupsTableProps {
  hiddenColumns?: string[]
  areLinksDisplayed?: boolean
  selectedGroup?: Group
  setSelectedGroup?: (group: Group) => void
  localStorageTableKey?: string
}

const GroupsTable = ({
  hiddenColumns,
  areLinksDisplayed = true,
  selectedGroup,
  setSelectedGroup,
  localStorageTableKey,
}: GroupsTableProps) => {
  const { t } = useTranslation()

  const { groupsState } = useSharedAtoms()
  const groupsData = useRecoilValue(groupsState)
  const groups = useMemo(
    () => groupsData?.toSorted((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? [],
    [groupsData]
  )

  const handleRadioSelect = useCallback(
    (uid: string) => {
      const group = uid ? groups.find((group) => group.metadata.uid === uid) : undefined
      if (group) {
        setSelectedGroup?.(group)
      }
    },
    [groups, setSelectedGroup]
  )

  const keyFn = useCallback((group: Group) => group.metadata.name ?? '', [])

  const filters = useFilters('group', groups)
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

  return (
    <AcmTableStateProvider localStorageKey={localStorageTableKey ?? 'groups-table-state'}>
      <AcmTable<Group>
        key="groups-table"
        filters={filters}
        columns={columns}
        keyFn={keyFn}
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
            title={t(`In order to view Groups, add Identity provider`)}
            message={
              <Trans
                i18nKey="Once Identity provider is added, Groups will appear in the list after they log in."
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
    </AcmTableStateProvider>
  )
}

export { GroupsTable }

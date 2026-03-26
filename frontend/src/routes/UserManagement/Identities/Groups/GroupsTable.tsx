/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useMemo } from 'react'
import { AcmButton, AcmEmptyState, AcmTable, compareStrings, IAcmTableButtonAction } from '~/ui-components'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { Group } from '../../../../resources/rbac'
import { groupsTableColumns, useFilters } from '../IdentityTableHelper'
import { useMergedGroups } from '../useMergedIdentities'

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

  const groupsData = useMergedGroups()
  const groups = useMemo(() => {
    const all = [...(groupsData ?? []), ...(additionalGroups ?? [])]
    const unique = all.filter((g, i, arr) => arr.findIndex((x) => x.metadata.name === g.metadata.name) === i)
    return unique.toSorted((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
  }, [groupsData, additionalGroups])

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
    <AcmTable<Group>
      key="groups-table"
      filters={filters}
      columns={columns}
      keyFn={keyFn}
      items={groups}
      tableActionButtons={tableActionButtons}
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
              {isCreateButtonDisplayed && onCreateClick && (
                <AcmButton variant="primary" onClick={onCreateClick}>
                  {createButtonText ?? t('Create group')}
                </AcmButton>
              )}
              <ViewDocumentationLink doclink={DOC_LINKS.IDENTITY_PROVIDER_CONFIGURATION} />
            </div>
          }
        />
      }
    />
  )
}

export { GroupsTable }

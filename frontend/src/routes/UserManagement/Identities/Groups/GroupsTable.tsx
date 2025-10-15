/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { Group } from '../../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmEmptyState, AcmTable, compareStrings } from '../../../../ui-components'
import { useFilters, groupsTableColumns } from '../IdentityTableHelper'

const GroupsTable = () => {
  const { t } = useTranslation()

  const { groupsState } = useSharedAtoms()
  const groupsData = useRecoilValue(groupsState)
  const groups = useMemo(() => {
    return groupsData?.toSorted((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? []
  }, [groupsData])

  const keyFn = useCallback((group: Group) => group.metadata.name ?? '', [])

  const filters = useFilters('group', groups)
  const columns = groupsTableColumns({ t })

  return (
    <PageSection>
      <AcmTable<Group>
        key="groups-table"
        filters={filters}
        columns={columns}
        keyFn={keyFn}
        items={groups}
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
    </PageSection>
  )
}

export { GroupsTable }

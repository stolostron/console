/* Copyright Contributors to the Open Cluster Management project */

import { useTranslation } from '../../../../lib/acm-i18next'
import { Placement } from '../../../../resources/placement'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  AcmButton,
  AcmEmptyState,
  AcmLabels,
  AcmPageContent,
  AcmTable,
  AcmVisitedLink,
} from '../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { navigateToBackCancelLocation } from '../../../../NavigationPath'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { HighlightSearchText } from '../../../../components/HighlightSearchText'

export default function PlacementsPage() {
  const { t } = useTranslation()
  const { placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)
  const navigate = useNavigate()

  return (
    <AcmPageContent id="placements">
      <PageSection hasBodyWrapper={false}>
        <PlacementsTable
          placements={placements}
          emptyState={
            <AcmEmptyState
              key="placementsEmptyState"
              title={t("You don't have any placements yet")}
              message={t('To get started, create a placement.')}
              action={
                <AcmButton
                  onClick={() => navigateToBackCancelLocation(navigate, NavigationPath.createPlacement)}
                  variant="primary"
                >
                  {t('Create placement')}
                </AcmButton>
              }
            />
          }
        />
      </PageSection>
    </AcmPageContent>
  )
}

export function PlacementsTable(props: { placements: Placement[]; emptyState: React.ReactNode }) {
  const { t } = useTranslation()
  const clusterSetsDisplayLimit = 3

  function placementKeyFn(placement: Placement) {
    return placement.metadata.uid!
  }

  return (
    <AcmTable<Placement>
      items={props.placements}
      columns={[
        {
          header: t('Name'),
          sort: 'metadata.name',
          search: 'metadata.name',
          cell: (placement: Placement, search: string) => {
            return (
              <AcmVisitedLink
                to={generatePath(NavigationPath.placementDetails, {
                  namespace: placement.metadata.namespace!,
                  name: placement.metadata.name!,
                })}
              >
                <HighlightSearchText text={placement.metadata.name!} searchText={search} isLink useFuzzyHighlighting />
              </AcmVisitedLink>
            )
          },
        },
        {
          header: t('Namespace'),
          sort: 'metadata.namespace',
          search: 'metadata.namespace',
          cell: (placement: Placement) => {
            return <span>{placement.metadata.namespace}</span>
          },
        },
        {
          header: t('Cluster sets'),
          tooltip: t('tooltip.placements.table.clusterSets'),
          cell: (placement: Placement) => {
            if (placement.spec.clusterSets) {
              const collapse = placement.spec.clusterSets.filter((_clusterSet, i) => i > clusterSetsDisplayLimit)
              return <AcmLabels labels={placement.spec.clusterSets} collapse={collapse} />
            } else {
              return '-'
            }
          },
        },
        {
          header: t('Selected clusters'),
          tooltip: t('tooltip.placements.table.selectedClusters'),
          cell: (placement: Placement) => {
            return <span>{placement.status?.numberOfSelectedClusters}</span>
          },
          sort: 'status.numberOfSelectedClusters',
          search: 'status.numberOfSelectedClusters',
        },
      ]}
      showExportButton
      keyFn={placementKeyFn}
      emptyState={props.emptyState}
    />
  )
}

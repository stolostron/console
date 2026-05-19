/* Copyright Contributors to the Open Cluster Management project */
import { DisplayMode, useDisplayMode, useSetFooterContent } from '@patternfly-labs/react-form-wizard'
import { Alert, Button, ButtonVariant, Tooltip } from '@patternfly/react-core'
import { useEffect } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { IPlacement } from '../common/resources/IPlacement'
import { PlacementDebugState, usePlacementDebug } from './usePlacementDebug'

export const PlacementMatchFooter = (props: {
  placement: IPlacement | undefined
  placementName?: string
  debugState?: PlacementDebugState
  onOpenModal: () => void
}) => {
  const { t } = useTranslation()
  const displayMode = useDisplayMode()
  const setFooterContent = useSetFooterContent()

  const ownDebugState = usePlacementDebug(props.debugState ? undefined : props.placement)
  const { matchedCount, totalClusters, error } = props.debugState ?? ownDebugState

  const hasLimit = props.placement?.spec?.numberOfClusters !== undefined
  const matchedLabel =
    !props.placement || !props.placementName || matchedCount === undefined
      ? '-'
      : hasLimit
        ? t('{{matched}} of {{total}} clusters', { matched: matchedCount, total: totalClusters })
        : t('{{count}} cluster', { count: matchedCount })

  useEffect(() => {
    setFooterContent(
      displayMode === DisplayMode.Step ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
          <span>{t('Matched by Placement')}:</span>{' '}
          {error ? (
            <Tooltip content={error.message || t('An unknown error occurred.')}>
              <Alert variant="warning" isInline isPlain title={t('Unable to determine cluster matches.')} />
            </Tooltip>
          ) : matchedLabel === '-' ? (
            <span>{matchedLabel}</span>
          ) : (
            <Button variant={ButtonVariant.link} isInline onClick={props.onOpenModal} style={{ padding: 0 }}>
              {matchedLabel}
            </Button>
          )}
        </div>
      ) : undefined
    )
    return () => setFooterContent(undefined)
  }, [displayMode, matchedLabel, error, setFooterContent, props.onOpenModal, t])

  return null
}

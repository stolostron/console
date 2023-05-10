/* Copyright Contributors to the Open Cluster Management project */

import { EmptyState, EmptyStateBody, EmptyStatePrimary, EmptyStateVariant, Title } from '@patternfly/react-core'
import { ReactNode } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import emptyTablePng from '../assets/EmptyTableIcon.png'
import emptyPageDarkThemeSVG from '../assets/AcmPlanetsDark.svg'
import emptyPageLightThemeSVG from '../assets/AcmPlanetsLight.svg'
import Folder from '../assets/Folder.png'

export enum AcmEmptyStateImage {
  folder = Folder,
}

export function AcmEmptyState(props: {
  title: string
  message?: string | ReactNode
  action?: ReactNode
  showIcon?: boolean
  image?: AcmEmptyStateImage
  isEmptyTableState?: boolean
}) {
  const theme =
    process.env.NODE_ENV === 'development' ? localStorage.getItem('theme') : localStorage.getItem('bridge/theme')
  const AcmPlanetsIcon = theme === 'light' ? emptyPageLightThemeSVG : emptyPageDarkThemeSVG
  const { t } = useTranslation()
  return (
    <EmptyState variant={EmptyStateVariant.large}>
      {props.isEmptyTableState ? (
        props.showIcon !== false && (
          <img src={props.image && emptyTablePng} style={{ width: '65%' }} alt={t('Empty state')} />
        )
      ) : (
        <AcmPlanetsIcon />
      )}
      <Title headingLevel="h4" size="lg">
        {props.title}
      </Title>
      <EmptyStateBody>{props.message}</EmptyStateBody>
      <EmptyStatePrimary>{props.action}</EmptyStatePrimary>
      {/* <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions> */}
    </EmptyState>
  )
}

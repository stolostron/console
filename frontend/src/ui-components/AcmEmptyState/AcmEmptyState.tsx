/* Copyright Contributors to the Open Cluster Management project */

import { EmptyState, EmptyStateBody, EmptyStatePrimary, EmptyStateVariant, Title } from '@patternfly/react-core'
import { ReactNode } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { emptyPagePng as emptyPageLightPng } from '../assets/EmptyPageIcon.png'
import emptyTablePng from '../assets/EmptyTableIcon.png'
import emptyPageDarkModePng from '../assets/EmptyPageIconDarkMode.png'
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
  const theme = localStorage.getItem('theme')
  const emptyPagePng = theme === 'light' ? emptyPageLightPng : emptyPageDarkModePng
  const { t } = useTranslation()
  return (
    <EmptyState variant={EmptyStateVariant.large}>
      {props.showIcon !== false && (
        <img
          src={props.image ?? (props.isEmptyTableState ? emptyTablePng : emptyPagePng)}
          style={{ width: props.isEmptyTableState ? '65%' : '50%' }}
          alt={t('Empty state')}
        />
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

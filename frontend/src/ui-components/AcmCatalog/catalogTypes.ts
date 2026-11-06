/* Copyright Contributors to the Open Cluster Management project */

import { AlertProps } from '@patternfly/react-core'
import { ElementType, ReactNode } from 'react'

export enum CatalogColor {
  blue = 'blue',
  cyan = 'teal',
  green = 'green',
  orange = 'orange',
  purple = 'purple',
  red = 'red',
  grey = 'grey',
}

export enum CatalogCardItemType {
  Description = 'description',
  List = 'list',
}

export interface ICatalogCardDescription {
  type: CatalogCardItemType.Description
  title?: string
  description: string
}

export interface ICatalogCardListItem {
  icon?: ReactNode
  text: string
  helpTitle?: string
  help?: ReactNode
  subTitles?: string[]
}

export interface ICatalogCardList {
  type: CatalogCardItemType.List
  title: string
  items: ICatalogCardListItem[]
  horizontal?: boolean
  icon?: ReactNode
}

export interface ICatalogCard {
  id: string
  icon?: ReactNode
  title: string
  items?: (ICatalogCardDescription | ICatalogCardList)[]
  labels?: { label: string; color?: CatalogColor }[]
  learnMore?: string
  badge?: string
  badgeColor?: CatalogColor
  badgeTooltip?: string
  badgeTooltipTitle?: string
  badgeList?: { badge?: string; badgeColor?: CatalogColor }[]
  alertTitle?: string
  alertContent?: ReactNode
  alertVariant?: AlertProps['variant']
  onClick?: () => void
}

export interface ICatalogBreadcrumb {
  id?: string
  label: string
  to?: string
  target?: string
  component?: ElementType
}

export type CatalogItemAction = { label: string; onClick: (item: ICatalogCard) => void } | { isSeparator: true }

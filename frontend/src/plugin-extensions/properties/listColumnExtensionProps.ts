/* Copyright Contributors to the Open Cluster Management project */

import { ITransform } from '@patternfly/react-table'

export type ListColumnExtensionProps = {
  /** the header of the column */
  header: string

  tooltip?: React.ReactNode

  transforms?: ITransform[]

  cellTransforms?: ITransform[]

  /** component type*/
  cell: React.ComponentType<{ resource?: any }>

  // If it is true, This column always the last one and isn't managed by column management filter
  // By default it is true
  isActionCol?: boolean
}

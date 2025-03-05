/* Copyright Contributors to the Open Cluster Management project */

import { ITransform } from '@patternfly/react-table'

export type ApplicationListColumnProps = {
  /** the header of the column */
  header: string

  tooltip?: React.ReactNode

  transforms?: ITransform[]

  cellTransforms?: ITransform[]

  /** component type*/
  cell: React.ComponentType<{ resource?: any }>
}

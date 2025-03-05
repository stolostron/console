/* Copyright Contributors to the Open Cluster Management project */

import { TooltipProps } from '@patternfly/react-core'

export type ActionExtensionProps = {
  /** Action identifier */
  id: string
  /** Display a tooltip for this action */
  tooltip?: string
  /** Additional tooltip props forwarded to tooltip component */
  tooltipProps?: Partial<TooltipProps>
  /** Inject a separator horizontal rule immediately before an action */
  addSeparator?: boolean
  /** Display an action as being ariaDisabled */
  isAriaDisabled?: boolean
  /** Display an action as being disabled */
  isDisabled?: (resource: any) => boolean
  /** Visible text for action */
  title: string | React.ReactNode
  /** Display action for this GVK type */
  /** For application, default action type is OpenShift*/
  model?: {
    apiVersion: string
    kind: string
  }[]
  /** Modal component type*/
  component: React.ComponentType<{ isOpen: boolean; close: () => void; resource?: any; cluster?: string }>
}

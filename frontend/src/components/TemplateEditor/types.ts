/* Copyright Contributors to the Open Cluster Management project */
import { ReactElement, ReactNode } from 'react'
import { TFunction } from 'react-i18next'

/** multitext parent control `active` shape */
export interface MultitextActiveState {
  multitextEntries: string[]
}

/** Mutable control object produced from template / wizard control definitions */
export interface TemplateControl {
  id?: string
  type?: string
  name?: string
  active?: unknown
  exception?: string
  disabled?: boolean
  hidden?: boolean | string | ((control: TemplateControl, controlData: TemplateControl[]) => boolean)
  validation?: TemplateControlValidation
  tooltip?: ReactNode
  tip?: ReactNode
  note?: ReactNode
  placeholder?: string
  opaque?: boolean
  icon?: ReactNode
  controlId?: string
  ref?: HTMLDivElement | null
  forceUpdate?: () => void
  group?: TemplateControl
  groupControlData?: TemplateControl[]
  grpNum?: number
  step?: WizardStepStructure
  content?: TemplateControl[]
  sectionRef?: HTMLDivElement | null
  sectionTitleRef?: HTMLDivElement | null
  prompts?: TemplateControlPrompts
  fetchAvailable?: TemplateControlFetchAvailable
  available?: unknown[]
  availableMap?: Record<string, unknown>
  isLoaded?: boolean
  isLoading?: boolean
  isFailed?: boolean
  isRefetching?: boolean
  userData?: string[]
  lastActive?: string
  hasReplacements?: boolean
  simplified?: (value: string, control: TemplateControl) => string | undefined
  describe?: boolean
  availableInfo?: Record<string, string>
  component?: ReactElement
  summary?: (control: TemplateControl, i18n: TFunction) => FinishSummaryRow[]
  mustValidate?: boolean
  isComplete?: boolean
  mutation?: (controlData: TemplateControl[]) => Promise<string>
  disableEditorOnSuccess?: boolean
  disablePreviousControlsOnSuccess?: boolean
  startAtStep?: string
  pauseControlCreationHereUntilSelected?: boolean
  updateNamePrefix?: string
  syncedSuffix?: string
  syncWith?: string
  syncedWith?: string
  refresh?: () => void
  addButtonText?: string
  multiselect?: boolean
  newEditorMode?: boolean
  collapseCardsControlOnSelect?: boolean
  collapsed?: boolean
  sectionTooltips?: Record<string, ReactNode>
  controlData?: TemplateControl[]
  isTrue?: boolean
  techPreview?: boolean
  title?: ReactNode | ((control: TemplateControl, controlData: TemplateControl[], i18n: TFunction) => ReactNode)
  subtitle?: ReactNode | ((control: TemplateControl, controlData: TemplateControl[], i18n: TFunction) => ReactNode)
  info?: ReactNode | ((control: TemplateControl, controlData: TemplateControl[], i18n: TFunction) => ReactNode)
  comment?: string
  overline?: boolean
  collapsable?: boolean
  summarize?: (summary: string[], i18n: TFunction) => void
  hasValueDescription?: boolean
  summaryKey?: string
  initial?: unknown
  startWithNone?: boolean
  subgroup?: boolean
  shadowed?: boolean
  mode?: string
  min?: number
}

export interface TemplateControlValidation {
  required?: boolean
  tester?: RegExp
  notification?: string
  contextTester?: (
    value: string,
    controlData: TemplateControl[],
    _unused: unknown,
    i18n: TFunction
  ) => string | undefined
}

export interface TemplateControlPrompts {
  type?: string
  prompt?: string
  url?: string
  icon?: ReactNode
  id?: string
  positionAboveControl?: boolean
  addPrompt?: string
  deletePrompt?: string
  disableDeleteForFirst?: boolean
}

export interface TemplateControlFetchAvailable {
  query: () => Promise<unknown>
  setAvailable: (control: TemplateControl, result: Record<string, unknown>) => void
  variables?:
    | Record<string, unknown>
    | ((control: TemplateControl, controlData: TemplateControl[]) => Record<string, unknown>)
  refetch?: () => void
  setAvailableMap?: (control: TemplateControl) => void
  loadingDesc?: string
  emptyDesc?: string
}

export type ControlData = TemplateControl[]

export interface ControlPanelNotification {
  exception: string
  variant?: 'danger' | 'warning' | 'success' | 'info' | 'custom'
}

export type HandleControlChangeFn = (
  control: TemplateControl,
  controlData: TemplateControl[],
  ...rest: unknown[]
) => void

export interface ControlPanelProps {
  controlData: TemplateControl[]
  controlProps?: Record<string, unknown>
  creationStatus?: string
  fetchData?: Record<string, unknown>
  handleCancelCreate: () => void
  handleCreateResource: () => void
  handleControlChange: HandleControlChangeFn
  handleGroupChange: (
    control: TemplateControl,
    controlData: TemplateControl[],
    creationView: unknown,
    inx?: number
  ) => void
  handleNewEditorMode: (
    control: TemplateControl,
    controlData: TemplateControl[],
    creationView: unknown,
    wizardRef: unknown
  ) => void
  i18n: TFunction
  isCustomName?: boolean
  isEditing?: boolean
  isLoaded?: boolean
  notifications?: ControlPanelNotification[]
  onChange?: (control: TemplateControl) => void
  originalControlData: TemplateControl[]
  resetStatus?: () => void
  setEditorReadOnly?: (readOnly: boolean) => void
  showEditor?: boolean
  showPortals?: Record<string, string>
  templateYAML?: unknown
  backButtonOverride?: () => void
}

export interface ControlPanelBaseProps {
  control: TemplateControl
  controlData: TemplateControl[]
  controlId: string
  i18n: TFunction
}

export interface ControlPanelInputProps extends ControlPanelBaseProps {
  handleChange: (...args: unknown[]) => void
}

export interface ControlPanelComboBoxProps extends ControlPanelBaseProps {
  handleControlChange: () => void
}

export interface ControlPanelCardsProps extends ControlPanelBaseProps {
  fetchData?: Record<string, unknown>
  handleChange: (selection: string | null) => void
  showEditor?: boolean
}

export interface ControlPanelPromptProps {
  control: TemplateControl
  handleAddActive?: (items: unknown) => void
  i18n: TFunction
}

export interface ControlPanelSkeletonProps {
  control: TemplateControl
  controlId: string
  i18n?: TFunction
}

/** Wizard step header object (same shape as template controls in practice). */
export type WizardSectionTitle = TemplateControl

export interface WizardStepSection {
  title: WizardSectionTitle
  content: TemplateControl[]
}

export interface WizardStepStructure {
  title: WizardSectionTitle
  sections: WizardStepSection[]
  controls?: TemplateControl[]
  id?: string
  index?: number
  name?: ReactNode
  enabled?: boolean
  component?: ReactNode
  steps?: WizardStepStructure[]
}

export interface ControlPanelWizardProps {
  i18n: TFunction
  steps: WizardStepStructure[]
  controlData: TemplateControl[]
  controlClasses: string
  setWizardRef: (ref: unknown) => void
  handleCreateResource: () => void
  handleCancelCreate: () => void
  renderControlSections: (sections: WizardStepSection[], grpId?: string) => ReactNode
  renderNotifications: (isForm?: boolean) => ReactNode
  setEditorReadOnly?: (readOnly: boolean) => void
  resetStatus?: () => void
  isEditing?: boolean
  creationStatus?: string
  backButtonOverride?: () => void
}

export interface FinishSummaryRow {
  term?: ReactNode
  desc?: ReactNode
  exception?: string
  validation?: TemplateControlValidation
  valueComponent?: ReactNode
}

export interface ControlPanelFinishProps {
  details: WizardStepStructure[]
  comment?: string
  renderNotifications: () => ReactNode
  startStep: number
  i18n: TFunction
}

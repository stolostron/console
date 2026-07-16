/* Copyright Contributors to the Open Cluster Management project */
export type SelectedSecret = {
  client_id: string
  client_secret: string
}

export type DropdownType = {
  value: string
  label: string
}

export interface RoleOption {
  label: string
  value: string
  roleVersion?: string
}
export interface WizardAccountRole {
  installerRole: RoleOption
  supportRole: RoleOption[]
  workerRole: RoleOption[]
}
export interface NormalizedAccountRole {
  prefix: string
  version: string
  Installer?: string
  Support?: string
  Worker?: string
  'Control plane'?: string
  hcpManagedPolicies?: boolean
  managedPolicies?: boolean
  [type: string]: string | boolean | undefined
}

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

export type RoleType = 'Installer' | 'Support' | 'Worker' | 'Control plane'
export interface NormalizedAccountRole {
  prefix: string
  version: string
  Installer?: string
  Support?: string
  Worker?: string
  'Control plane'?: string
  hcpManagedPolicies?: boolean
  managedPolicies?: boolean
  roleArns: Partial<Record<RoleType, string>>
}

export interface OpenShiftVersionsData {
  default?: DropdownType
  latest?: DropdownType
  releases: DropdownType[]
}

export interface OpenshiftVersion {
  available_channels: string[]
  available_upgrades: string[]
  channel_group: string
  default: boolean
  enabled: boolean
  hosted_control_plane_default: boolean
  hosted_control_plane_enabled: boolean
  id: string
  raw_id: string
  rosa_enabled: boolean
  wif_enabled: boolean
  end_of_life_timestamp: string
}

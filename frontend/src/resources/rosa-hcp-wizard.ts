/* Copyright Contributors to the Open Cluster Management project */

export interface OrganizationLabel {
  id: string
  internal: boolean
  key: string
  organization_id: string
  type: string
  value: string
}

export interface AwsAccountIdsResponse {
  items?: OrganizationLabel[]
}

export interface CloudAccount {
  cloud_account_id: string
  cloud_provider_id: string
}

export interface OrganizationQuota {
  quota_id: string
  cloud_accounts: CloudAccount[]
}

export interface OrganizationQuotaResponse {
  items?: OrganizationQuota[]
}

export interface WizardBasePayload {
  service_account_id: string
  service_account_secret: string
}

export interface WizardErrorResponse {
  kind?: string
  reason?: string
  body?: { kind?: string; reason?: string }
}

interface OIDCConfig {
  id: string
  organization_id: string
  issuer_url: string
  managed: boolean
  reusable: boolean
}
export interface OIDCConfigResponse {
  page: number
  size: number
  total: number
  items: OIDCConfig[]
}

export type AwsAccountPayload = {
  aws_account_id: string
}

/* Copyright Contributors to the Open Cluster Management project */

import { OpenshiftVersion } from '~/routes/Infrastructure/Clusters/ManagedClusters/components/rosahcp/constants/types'

export interface CloudRegion {
  kind?: string
  id?: string
  href?: string
  ccs_only?: boolean
  kms_location_id?: string
  kms_location_name?: string
  cloud_provider?: CloudProvider
  display_name?: string
  enabled?: boolean
  govcloud?: boolean
  name?: string
  supports_hypershift?: boolean
  supports_multi_az?: boolean
}

export interface CloudProvider {
  kind?: string
  id?: string
  href?: string
  display_name?: string
  name?: string
  regions?: CloudRegion[]
}

export interface CloudProviderResponse {
  items?: CloudProvider[]
  page?: number
  size?: number
  total?: number
}
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

export type ClusterNameCheckPayload = {
  cluster_name: string
  region?: string
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

interface ROSAHCPCluster {
  kind: string
  id: string
  name: string
  external_id: string
  display_name: string
}
export interface ClusterNameUniquenessResponse {
  kind: string
  page: number
  size: number
  total: number
  items: ROSAHCPCluster[]
}
export interface AccountRoleARN {
  arn: string
  type: string
  isAdmin: boolean
  roleVersion: string
  managedPolicies: boolean
  hcpManagedPolicies: boolean
}

export interface AccountRole {
  prefix: string
  kind: string
  items: AccountRoleARN[]
}

export interface RoleARNsResponse {
  kind: string
  aws_account_id: string
  items: AccountRole[]
  page: number
  size: number
  total: number
}

export interface OCMRoleResponse {
  arn: string
  type: string
  isAdmin: boolean
  profile: string
  roleVersion: string
  managedPolicies: boolean
  hcpManagedPolicies: boolean
}

export interface UserRoleResponse {
  account_id: string
  id: string
  internal: boolean
  key: string
  kind: string
  value: string
}

export interface OpenshiftVersionResponse {
  kind: string
  page: number
  size: number
  total: number
  items: OpenshiftVersion[]
}

export interface AWSSecurityGroup {
  id: string
  name: string
  red_hat_managed: boolean
}

export interface AWSSubnets {
  subnet_id: string
  name: string
  red_hat_managed: boolean
  public: boolean
  availability_zone: string
  cidr_block: string
}

export interface VPC {
  name: string
  red_hat_managed: boolean
  id: string
  cidr_block: string
  subnets?: string[]
  aws_subnets: AWSSubnets[]
  aws_security_groups?: AWSSecurityGroup[]
}

export interface VPCsResponse {
  body: {
    kind: string
    page: number
    size: number
    total: number
    items: VPC[]
  }
  statusCode: number
}

// Has to be types to satisfy index signature of Record<string, unknown>
export type AwsAccountPayload = {
  aws_account_id: string
}

export type VPCsPayload = {
  aws: {
    account_id?: string
    sts: {
      role_arn?: string
    }
  }
  region: {
    id?: string
  }
}

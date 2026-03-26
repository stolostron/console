/* Copyright Contributors to the Open Cluster Management project */

export interface ClaimMappings {
  username?: {
    claim?: string
    prefix?: { prefixString?: string }
    prefixPolicy?: 'Prefix' | 'NoPrefix'
  }
  groups?: {
    claim?: string
    prefix?: string
  }
}

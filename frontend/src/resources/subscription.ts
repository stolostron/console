/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export interface PackageOverride {
  packageName?: string
  packageAlias?: string
  packageOverrides?: unknown[]
}

export interface SubscriptionClusterStatus {
  packages?: Record<
    string,
    {
      phase?: string
      [key: string]: unknown
    }
  >
  [key: string]: unknown
}

export const SubscriptionApiVersion = 'apps.open-cluster-management.io/v1'
export type SubscriptionApiVersionType = 'apps.open-cluster-management.io/v1'

export const SubscriptionKind = 'Subscription'
export type SubscriptionKindType = 'Subscription'

export const SubscriptionDefinition: IResourceDefinition = {
  apiVersion: SubscriptionApiVersion,
  kind: SubscriptionKind,
}

export interface Subscription extends IResource {
  apiVersion: SubscriptionApiVersionType
  kind: SubscriptionKindType
  metadata: Metadata
  spec: {
    channel?: string
    name?: string
    placement?: {
      placementRef?: {
        kind: string
        name: string
      }
    }
    packageOverrides?: PackageOverride[]
    packageFilter?: {
      version: string
    }
    secondaryChannel?: string
    timewindow?: {
      windowtype: string
      daysofweek: string[]
      location: string
      hours: string[]
      missingData?: unknown
    }
  }
  status?: {
    message?: string
    phase?: string
    statuses?: Record<string, SubscriptionClusterStatus>
  }
}

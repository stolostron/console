/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResourceDefinition } from './resource'

export const AnsibleInventoryApiVersion = 'tower.ansible.com/v1alpha1'
export type AnsibleInventoryApiVersionType = 'tower.ansible.com/v1alpha1'

export const AnsibleInventoryKind = 'AnsibleInventory'
export type AnsibleInventoryKindType = 'AnsibleInventory'

export type AnsibleInventoryType = 'Inventory'
export type AnsibleApiInventoryType = 'inventory'

export const AnsibleInventoryDefinition: IResourceDefinition = {
  apiVersion: AnsibleInventoryApiVersion,
  kind: AnsibleInventoryKind,
}

export interface AnsibleInventory {
  apiVersion: AnsibleInventoryApiVersionType
  kind: AnsibleInventoryKindType
  metadata: Metadata
  spec?: {
    extra_vars: {}
  }
}

export interface AnsibleTowerInventoryList {
  count?: number
  next?: string
  results: Array<AnsibleTowerInventory>
}
export interface AnsibleTowerInventory {
  name?: string
  type?: AnsibleApiInventoryType
}

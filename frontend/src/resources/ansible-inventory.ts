/* Copyright Contributors to the Open Cluster Management project */

export type AnsibleApiInventoryType = 'inventory'

export interface AnsibleTowerInventoryList {
  count?: number
  next?: string
  results: Array<AnsibleTowerInventory>
}
export interface AnsibleTowerInventory {
  name: string
  type?: AnsibleApiInventoryType
  description?: string
  id: string
}

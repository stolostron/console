/* Copyright Contributors to the Open Cluster Management project */

import type { IResource } from './resource'

export interface Secret extends IResource {
  data?: {
    [key: string]: string
  }
}

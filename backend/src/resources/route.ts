/* Copyright Contributors to the Open Cluster Management project */

import { IResource } from './resource'

export interface Route extends IResource {
  spec: {
    host?: string
    path?: string
    to?: {
      kind?: 'Service'
      name?: string
      weight?: number
    }
    port?: {
      targetPort?: string
    }
    tls?: {
      termination?: 'edge' | 'passthrough' | 'reencrypt'
      insecureEdgeTerminationPolicy?: 'Allow' | 'Disable' | 'Redirect'
    }
    wildcardPolicy?: 'Subdomain' | 'None'
  }
}

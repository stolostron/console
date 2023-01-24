/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '@patternfly-labs/react-form-wizard'

export type IClusterSetBinding = IResource & {
  spec?: {
    clusterSet?: string
  }
}

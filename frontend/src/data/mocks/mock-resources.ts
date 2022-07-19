/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '../../resources'
import { mockLocalManagedCluster } from './managed-clusters/local-cluster'
import { mockDefaultNamespace } from './namespaces/default'
import { mockLocalClusterNamespace } from './namespaces/local-cluster'

export const mockResources: IResource[] = [mockDefaultNamespace, mockLocalManagedCluster, mockLocalClusterNamespace]

/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '../../resources'
import { mockClusterimagesets } from './mock-clusterimagesets'
import { mockClustermanagementaddons } from './mock-clustermanagementaddons'
import { mockCredentials } from './mock-credentials'
import { mockManagedclusters } from './mock-managedclusters'
import { mockManagedclustersets } from './mock-managedclustersets'
import { mockNamespaces } from './mock-namespaces'

export const mockResources: IResource[] = [
    ...mockClusterimagesets,
    ...mockClustermanagementaddons,
    ...mockCredentials,
    ...mockManagedclusters,
    ...mockManagedclustersets,
    ...mockNamespaces,
]

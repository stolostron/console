import { IResource } from '../../lib/Resource'
import { secretMethods } from '../../lib/Secret'
import { clusterDeploymentMethods, ClusterDeployment } from '../resources/cluster-deployment'

export async function applyResources(resources: IResource[]) {
    for (const resource of resources) {
        switch (resource.kind) {
            case 'Secret':
                secretMethods.create(resource)
                break
            case 'ProviderConnection':
                secretMethods.create(resource)
                break
            case 'ClusterDeployment':
                clusterDeploymentMethods.create(resource as ClusterDeployment)
                break
        }
    }
}

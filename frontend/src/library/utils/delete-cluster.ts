import { managedClusterMethods } from '../../lib/ManagedCluster'
import { clusterDeploymentMethods } from '../resources/cluster-deployment'

export async function deleteCluster(clusterName: string) {
    try {
        await managedClusterMethods.delete(clusterName)
        await clusterDeploymentMethods.delete(clusterName, clusterName)
    } catch (err) {
        console.log(err)
    }
}

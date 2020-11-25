import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { getClusterDeployment, listClusterDeployments, ClusterDeployment } from '../resources/cluster-deployment'
import { getManagedClusterInfo, listMCIs, ManagedClusterInfo, NodeInfo, OpenShiftDistributionInfo } from '../resources/managed-cluster-info'
import {
    listCertificateSigningRequests,
    CertificateSigningRequest,
    CSR_CLUSTER_LABEL,
} from '../resources/certificate-signing-requests'
import { IRequestResult } from './resource-request'
import { getLatest } from './utils'

export enum ClusterStatus {
    'pending' = 'pending',
    'destroying' = 'destroying',
    'creating' = 'creating',
    'failed' = 'failed',
    'detached' = 'detached',
    'detaching' = 'detaching',
    'notaccepted' = 'notaccepted',
    'needsapproval' = 'needsapproval',
    'pendingimport' = 'pendingimport',
    'ready' = 'ready',
    'offline' = 'offline',
}

export type Cluster = {
    name: string | undefined
    namespace: string | undefined
    status: ClusterStatus
    distributionVersion:  {
        k8sVersion: string | undefined
        ocp: OpenShiftDistributionInfo | undefined
    }
    labels: { [key: string]: string } | undefined
    nodes: NodeInfo & { active: number, inactive: number }
    kubeApiServer: string | undefined
    consoleURL: string | undefined
    hiveSecrets: {
        kubeconfig: string | undefined
        kubeadmin: string | undefined
        installConfig: string | undefined
    }
    isHive: boolean
    isManaged: boolean
}

export function getSingleCluster(
    namespace: string,
    name: string
): IRequestResult<PromiseSettledResult<ClusterDeployment | ManagedClusterInfo | CertificateSigningRequest[]>[]> {
    const results = [
        getClusterDeployment(namespace, name),
        getManagedClusterInfo(namespace, name),
        listCertificateSigningRequests(name),
    ]
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}

export function getAllClusters(): IRequestResult<
    PromiseSettledResult<ClusterDeployment[] | ManagedClusterInfo[] | CertificateSigningRequest[]>[]
> {
    const results = [listClusterDeployments(), listMCIs(), listCertificateSigningRequests()]
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}

export function getCluster(
    managedClusterInfo: ManagedClusterInfo,
    clusterDeployment: ClusterDeployment,
    certificateSigningRequests: CertificateSigningRequest[]
): Cluster {
    return {
        name: clusterDeployment?.metadata.name ?? managedClusterInfo?.metadata.name,
        namespace: clusterDeployment?.metadata.namespace ?? managedClusterInfo?.metadata.namespace,
        status: getClusterStatus(clusterDeployment, managedClusterInfo, certificateSigningRequests),
        distributionVersion: getDistributionInfo(managedClusterInfo),
        labels: managedClusterInfo?.metadata.labels,
        nodes: getNodes(managedClusterInfo),
        kubeApiServer: getKubeApiServer(clusterDeployment, managedClusterInfo),
        consoleURL: getConsoleUrl(clusterDeployment, managedClusterInfo),
        hiveSecrets: getHiveSecrets(clusterDeployment),
        isHive: !!clusterDeployment,
        isManaged: !!managedClusterInfo,
    }
}

export function getDistributionInfo(managedClusterInfo: ManagedClusterInfo) {
    const k8sVersion = managedClusterInfo.status?.version
    const { ocp } = managedClusterInfo.status?.distributionInfo ?? {}
    return { k8sVersion, ocp }
}

export function getKubeApiServer(clusterDeployment: ClusterDeployment, managedClusterInfo: ManagedClusterInfo) {
    return clusterDeployment.status?.apiURL ?? managedClusterInfo.spec?.masterEndpoint
}

export function getConsoleUrl(clusterDeployment: ClusterDeployment, managedClusterInfo: ManagedClusterInfo) {
    return clusterDeployment.status?.webConsoleURL ?? managedClusterInfo.status?.consoleURL
}

export function getNodes(managedClusterInfo: ManagedClusterInfo) {
    const nodeList: NodeInfo[] = managedClusterInfo.status?.nodeList ?? []
    let active = 0
    let inactive = 0

    nodeList.forEach((node: NodeInfo) => {
        const readyCondition = node.conditions?.find((condition) => condition.type === 'Ready')
        readyCondition?.status === 'True' ? active++ : inactive++
    })
    return { nodeList, active, inactive }
}

export function getHiveSecrets(clusterDeployment: ClusterDeployment) {
    return {
        kubeconfig: clusterDeployment.spec?.clusterMetadata?.adminKubeconfigSecretRef.name,
        kubeadmin: clusterDeployment.spec?.clusterMetadata?.adminPasswordSecretRef.name,
        installConfig: clusterDeployment.spec?.provisioning.installConfigSecretRef.name,
    }
}

export function getClusterStatus(
    clusterDeployment: ClusterDeployment,
    managedClusterInfo: ManagedClusterInfo,
    certificateSigningRequests: CertificateSigningRequest[]
) {
    const checkForCondition = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) =>
        conditions.find((c) => c.type === condition)?.status === 'True'

    let cdStatus = ClusterStatus.pending
    const cdConditions: V1CustomResourceDefinitionCondition[] = clusterDeployment.status?.conditions ?? []
    const provisionFailed = checkForCondition('ProvisionedFailed', cdConditions)
    const provisionLaunchError = checkForCondition('InstallLaunchError', cdConditions)
    const deprovisionLaunchError = checkForCondition('DeprovisionLaunchError', cdConditions)

    // ClusterDeployment status

    // provision success
    if (clusterDeployment.spec?.installed) {
        cdStatus = ClusterStatus.detached

    // deprovisioning
    } else if (clusterDeployment.metadata.deletionTimestamp) {
        cdStatus = ClusterStatus.destroying

    // provision/deprovision failure
    } else if (provisionFailed || provisionLaunchError || deprovisionLaunchError) {
        cdStatus = ClusterStatus.failed

    // provisioning - default
    } else if (!clusterDeployment.spec?.installed) {
        cdStatus = ClusterStatus.creating
    }

    // if mc doesn't exist, default to cd status
    if (!managedClusterInfo) {
        return cdStatus
    }

    let mcStatus = ClusterStatus.pending
    const mcConditions: V1CustomResourceDefinitionCondition[] = managedClusterInfo.status?.conditions ?? []
    const clusterAccepted = checkForCondition('HubAcceptedManagedCluster', mcConditions)
    const clusterJoined = checkForCondition('ManagedClusterJoined', mcConditions)
    const clusterAvailable = checkForCondition('ManagedClusterConditionAvailable', mcConditions)

    // ManagedCluster status

    // detaching
    if (managedClusterInfo.metadata.deletionTimestamp) {
        mcStatus = ClusterStatus.detaching

    // not accepted
    } else if (!clusterAccepted) {
        mcStatus = ClusterStatus.notaccepted

    // not joined
    } else if (!clusterJoined) {
        mcStatus = ClusterStatus.pendingimport

        // check for csrs awaiting approval
        if (certificateSigningRequests && certificateSigningRequests.length) {
            const clusterCsrs =
                certificateSigningRequests?.filter(
                    (csr) => csr.metadata?.labels?.[CSR_CLUSTER_LABEL] === managedClusterInfo.metadata.name
                ) ?? []
            const activeCsr = getLatest<CertificateSigningRequest>(clusterCsrs, 'metadata.creationTimestamp')
            mcStatus = !activeCsr?.status?.certificate ? ClusterStatus.needsapproval : ClusterStatus.pending
        }
    } else {
        mcStatus = clusterAvailable ? ClusterStatus.ready : ClusterStatus.offline
    }

    // if ManagedCluster has not joined or is detaching, show ClusterDeployment status
    // as long as it is not 'detached' (which is the ready state when there is no attached ManagedCluster,
    // so this is the case is the cluster is being detached but not destroyed)
    if ((mcStatus === 'detaching' || !clusterJoined) && cdStatus !== 'detached') {
        return cdStatus
    } else {
        return mcStatus
    }
}

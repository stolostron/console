import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { getClusterDeployment, listClusterDeployments, ClusterDeployment } from '../resources/cluster-deployment'
import {
    getManagedClusterInfo,
    listMCIs,
    ManagedClusterInfo,
    NodeInfo,
    OpenShiftDistributionInfo,
} from '../resources/managed-cluster-info'
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
    distribution: DistributionInfo | undefined
    labels: { [key: string]: string } | undefined
    nodes: Nodes | undefined
    kubeApiServer: string | undefined
    consoleURL: string | undefined
    hiveSecrets: HiveSecrets | undefined
    isHive: boolean
    isManaged: boolean
}

export type DistributionInfo = {
    k8sVersion: string | undefined
    ocp: OpenShiftDistributionInfo | undefined
    displayVersion: string | undefined
}

export type HiveSecrets = {
    kubeconfig: string | undefined
    kubeadmin: string | undefined
    installConfig: string | undefined
}

export type Nodes = {
    active: number
    inactive: number
    nodeList: NodeInfo[]
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

export function mapClusters(
    clusterDeployments: ClusterDeployment[] = [],
    managedClusterInfos: ManagedClusterInfo[] = [],
    certificateSigningRequests: CertificateSigningRequest[] = []
) {
    const uniqueClusterNames = Array.from(
        new Set([
            ...clusterDeployments.map((cd) => cd.metadata.name),
            ...managedClusterInfos.map((mc) => mc.metadata.name),
        ])
    )
    return uniqueClusterNames.map((cluster) => {
        const clusterDeployment = clusterDeployments?.find((cd) => cd.metadata?.name === cluster)
        const managedClusterInfo = managedClusterInfos?.find((mc) => mc.metadata?.name === cluster)
        return getCluster(managedClusterInfo, clusterDeployment, certificateSigningRequests)
    })
}

export function getCluster(
    managedClusterInfo: ManagedClusterInfo | undefined,
    clusterDeployment: ClusterDeployment | undefined,
    certificateSigningRequests: CertificateSigningRequest[] | undefined
): Cluster {
    return {
        name: clusterDeployment?.metadata.name ?? managedClusterInfo?.metadata.name,
        namespace: clusterDeployment?.metadata.namespace ?? managedClusterInfo?.metadata.namespace,
        status: getClusterStatus(clusterDeployment, managedClusterInfo, certificateSigningRequests),
        distribution: getDistributionInfo(managedClusterInfo),
        labels: managedClusterInfo?.metadata.labels,
        nodes: getNodes(managedClusterInfo),
        kubeApiServer: getKubeApiServer(clusterDeployment, managedClusterInfo),
        consoleURL: getConsoleUrl(clusterDeployment, managedClusterInfo),
        hiveSecrets: getHiveSecrets(clusterDeployment),
        isHive: !!clusterDeployment,
        isManaged: !!managedClusterInfo,
    }
}

export function getDistributionInfo(managedClusterInfo: ManagedClusterInfo | undefined) {
    if (!managedClusterInfo) return undefined

    const k8sVersion = managedClusterInfo.status?.version
    const ocp = managedClusterInfo.status?.distributionInfo?.ocp
    const displayVersion = ocp?.version ? `OpenShift ${ocp.version}` : k8sVersion
    return { k8sVersion, ocp, displayVersion }
}

export function getKubeApiServer(
    clusterDeployment: ClusterDeployment | undefined,
    managedClusterInfo: ManagedClusterInfo | undefined
) {
    return clusterDeployment?.status?.apiURL ?? managedClusterInfo?.spec?.masterEndpoint
}

export function getConsoleUrl(
    clusterDeployment: ClusterDeployment | undefined,
    managedClusterInfo: ManagedClusterInfo | undefined
) {
    return clusterDeployment?.status?.webConsoleURL ?? managedClusterInfo?.status?.consoleURL
}

export function getNodes(managedClusterInfo: ManagedClusterInfo | undefined) {
    if (!managedClusterInfo) return undefined

    const nodeList: NodeInfo[] = managedClusterInfo.status?.nodeList ?? []
    let active = 0
    let inactive = 0

    nodeList.forEach((node: NodeInfo) => {
        const readyCondition = node.conditions?.find((condition) => condition.type === 'Ready')
        readyCondition?.status === 'True' ? active++ : inactive++
    })
    return { nodeList, active, inactive }
}

export function getHiveSecrets(clusterDeployment: ClusterDeployment | undefined) {
    if (!clusterDeployment) return undefined
    return {
        kubeconfig: clusterDeployment.spec?.clusterMetadata?.adminKubeconfigSecretRef.name,
        kubeadmin: clusterDeployment.spec?.clusterMetadata?.adminPasswordSecretRef.name,
        installConfig: clusterDeployment.spec?.provisioning.installConfigSecretRef.name,
    }
}

export function getClusterStatus(
    clusterDeployment: ClusterDeployment | undefined,
    managedClusterInfo: ManagedClusterInfo | undefined,
    certificateSigningRequests: CertificateSigningRequest[] | undefined
) {
    const checkForCondition = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) =>
        conditions.find((c) => c.type === condition)?.status === 'True'

    // ClusterDeployment status
    let cdStatus = ClusterStatus.pending
    if (clusterDeployment) {
        const cdConditions: V1CustomResourceDefinitionCondition[] = clusterDeployment?.status?.conditions ?? []
        const provisionFailed = checkForCondition('ProvisionFailed', cdConditions)
        const provisionLaunchError = checkForCondition('InstallLaunchError', cdConditions)
        const deprovisionLaunchError = checkForCondition('DeprovisionLaunchError', cdConditions)

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
    }

    // if mc doesn't exist, default to cd status
    if (!managedClusterInfo) {
        return cdStatus
    }

    // ManagedCluster status
    let mcStatus = ClusterStatus.pending
    const mcConditions: V1CustomResourceDefinitionCondition[] = managedClusterInfo.status?.conditions ?? []
    const clusterAccepted = checkForCondition('HubAcceptedManagedCluster', mcConditions)
    const clusterJoined = checkForCondition('ManagedClusterJoined', mcConditions)
    const clusterAvailable = checkForCondition('ManagedClusterConditionAvailable', mcConditions)

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

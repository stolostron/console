/* Copyright Contributors to the Open Cluster Management project */

export enum ProviderID {
    GCP = 'gcp',
    AWS = 'aws',
    AZR = 'azr',
    ANS = 'ans',
    VMW = 'vmw',
    BMC = 'bmc',
    RHOCM = 'rhocm',
    OST = 'ost',
    UKN = 'unknown',
    ANS = 'ans',
}

interface Provider {
    name: string
    key: ProviderID
}

export const providers: Provider[] = [
    { key: ProviderID.GCP, name: 'Google Cloud Platform' },
    { key: ProviderID.AWS, name: 'Amazon Web Services' },
    { key: ProviderID.AZR, name: 'Microsoft Azure' },
    { key: ProviderID.VMW, name: 'VMware vSphere' },
    { key: ProviderID.BMC, name: 'Bare Metal' },
    { key: ProviderID.RHOCM, name: 'Red Hat OpenShift Cluster Manager' },
    { key: ProviderID.OST, name: 'Red Hat OpenStack' },
]

export function getProvider(name: string): Provider {
    const provider = providers.find((provider) => provider.name === name)
    if (provider) return provider
    return { key: ProviderID.UKN, name: 'Unknown' }
}

export function getProviderByKey(key: ProviderID): Provider {
    const provider = providers.find((provider) => provider.key === key)
    if (provider) return provider
    return { key: ProviderID.UKN, name: 'Unknown' }
}

export enum KubernetesPlatform {
    AKS = 'aks',
    EKS = 'eks',
    GKE = 'gke',
    OCP = 'ocp',
    UKN = 'Unknown',
}

import { getBackendUrl } from '../../../resources/utils'
//import { IResource } from '../../../resources/resource'

// export interface Provider extends IResource {
//   metadata: {
//     name: string
//     namespace: string
//     uid: string
//   }
// }

// export interface NetworkMap extends IResource {
//   spec: {
//     map: Array<{
//       destination: {
//         type: string
//       }
//       source: {
//         type: string
//       }
//     }>
//     provider: {
//       destination: Provider
//       source: Provider
//     }
//   }
// }

// export interface StorageMap extends IResource {
//   spec: {
//     map: Array<{
//       destination: {
//         storageClass: string
//       }
//       source: {
//         id: string
//         name: string
//       }
//     }>
//     provider: {
//       destination: Provider
//       source: Provider
//     }
//   }
// }

export interface ForkliftResource {
  uid: string
  name: string
  namespace: string
}

export interface VMResource {
  uid: string
  name: string
  namespace: string
  networks: any[]
  architecture: string
  dataVolumeTemplates: any[]
}

async function fetchForkliftData(endpoint: string) {
  try {
    const res = await fetch(`${getBackendUrl()}${endpoint}`, {
      credentials: 'include',
      headers: { accept: 'application/json' },
    })
    return await res.json()
  } catch (err) {
    console.error(err)
  }
}

function transformToForkliftResource(data: any[]): ForkliftResource[] {
  if (!Array.isArray(data)) return []

  return data.map((item) => ({
    uid: item.uid,
    name: item.name,
    namespace: item.namespace || '',
  }))
}

function transformToVMResource(data: any): VMResource {
  if (!data) {
    return {
      uid: '',
      name: '',
      namespace: '',
      networks: [],
      architecture: '',
      dataVolumeTemplates: [],
    }
  }

  return {
    uid: data.uid || '',
    name: data.name || '',
    namespace: data.namespace || '',
    networks: data.object?.spec?.template?.spec?.networks || [],
    architecture: data.object?.spec?.template?.spec?.architecture || '',
    dataVolumeTemplates: data.object?.spec?.dataVolumeTemplates || [],
  }
}

export async function getProviders(): Promise<ForkliftResource[]> {
  const data = await fetchForkliftData('/forklift/providers/openshift')
  return transformToForkliftResource(data)
}

export async function getClusterStorageClasses(providerID: string): Promise<ForkliftResource[]> {
  const data = await fetchForkliftData(`/forklift/providers/openshift/${providerID}/storageclasses`)
  return transformToForkliftResource(data)
}

export async function getClusterNetworkAttachmentDefinitions(providerID: string): Promise<ForkliftResource[]> {
  const data = await fetchForkliftData(`/forklift/providers/openshift/${providerID}/networkattachmentdefinitions`)
  return transformToForkliftResource(data)
}

export async function getVMDetails(providerID: string, vmID: string): Promise<VMResource> {
  const data = await fetchForkliftData(`/forklift/providers/openshift/${providerID}/vms/${vmID}`)
  return transformToVMResource(data)
}

async function getProviderIdFromCluster(clusterName: string): Promise<string> {
  const providers = await fetchForkliftData(`/forklift/providers/openshift`)

  if (!Array.isArray(providers)) {
    return ''
  }

  for (const provider of providers) {
    // Remove '-mtv' suffix from provider name before comparing
    const providerNameWithoutSuffix = provider.name?.endsWith('-mtv') ? provider.name.slice(0, -4) : provider.name

    if (providerNameWithoutSuffix === clusterName) {
      return provider.uid || ''
    }
  }

  return ''
}

export async function canVMStorageBeMigrated(vmID: string, targetCluster: string): Promise<boolean> {
  const providerID = await getProviderIdFromCluster(targetCluster)
  const vm = await getVMDetails(providerID, vmID)
  const vmStorage = vm.dataVolumeTemplates
  const clusterStorage = await getClusterStorageClasses(providerID)

  console.log('MATT vmStorage', vmStorage)
  console.log('MATT clusterStorage', clusterStorage)

  return false
}

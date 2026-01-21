/* Copyright Contributors to the Open Cluster Management project */
import { set } from 'lodash'
import { Fleet } from '../../types'

/**
 * Sets a value at the specified path on an object, but only if the value is defined.
 * @param obj - The object to modify
 * @param path - The path where the value should be set
 * @param value - The value to check for definedness
 * @param valueToSet - Optional alternative value to set instead of the original value
 */
const setIfDefined = (obj: any, path: string, value: any, valueToSet?: any): void => {
  if (value !== undefined) {
    set(obj, path, valueToSet ?? value)
  }
}
/**
 * Converts a value to a boolean from an ACM search result, where properties are always strings.
 * @param value - The value to convert to a boolean
 * @returns The boolean value of the input value
 */
const convertToBoolean = (value: any) => {
  if (typeof value === 'boolean') {
    return value
  } else if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return false
}

/**
 * Generates a resource key from the kind and optional API group.
 * @param kind - The Kubernetes resource kind
 * @param apigroup - Optional API group
 * @returns A string key in the format "kind" or "kind.apigroup"
 */
const getResourceKey = (kind: string, apigroup?: string): string => {
  if (apigroup) {
    return `${kind}.${apigroup}`
  }
  return kind
}

/**
 * Parses a condition string from search results into an array of condition objects.
 * @param conditionString - A semicolon-separated string of conditions in "type=status" format
 * @returns An array of condition objects with type and status, or undefined if invalid
 */
const parseConditionString = (conditionString: string): Array<{ type: string; status: string }> | undefined => {
  if (!conditionString || typeof conditionString !== 'string') {
    return undefined
  }
  const conditions = conditionString
    .split(';')
    .filter((condition) => condition.includes('='))
    .map((condition) => {
      const [type, status] = condition.split('=')
      return {
        type: type?.trim(),
        status: status?.trim(),
      }
    })
    .filter((condition) => condition.type && condition.status)
  return conditions.length > 0 ? conditions : undefined
}

/**
 * Parses a map string from search results into an object.
 * @param mapString - A semicolon-separated string of key-value pairs in "key=value" format
 * @returns An object with the key-value pairs, or undefined if the input falsy or not a string
 */
const parseMapString = (mapString: string): Record<string, string> | undefined => {
  if (!mapString || typeof mapString !== 'string') {
    return undefined
  }
  return Object.fromEntries(mapString.split(';').map((pair: string) => pair.trimStart().split('=')))
}

/**
 * Parses a list string from search results into an array of strings.
 * @param listString - A semicolon-separated string of values
 * @returns An array with the values, or undefined if the input is falsy or not a string
 */
const parseListString = (listString: string): string[] | undefined => {
  if (!listString || typeof listString !== 'string') {
    return undefined
  }
  return listString
    .split(';')
    .map((value: string) => value.trim())
    .filter(Boolean)
}

/**
 * Creates a resource object with the basic metadata available from search results.
 * @param item - The search result item
 * @returns A resource object with the appropriate nested fields
 */
const createResourceCommon = (item: any): any => {
  const resource: any = {
    cluster: item.cluster,
    apiVersion: item.apigroup ? `${item.apigroup}/${item.apiversion}` : item.apiversion,
    kind: item.kind,
    metadata: {
      annotations: parseMapString(item.annotation),
      creationTimestamp: item.created,
      name: item.name,
      namespace: item.namespace,
      labels: parseMapString(item.label),
      uid: item._uid?.split('/').pop() || undefined, // _uid field holds '<cluster>/<uid>' but may be removed in the future
    },
  }
  setIfDefined(resource, 'status.conditions', parseConditionString(item.condition as string))
  return resource
}

/**
 * Converts a flattened search result item into a properly structured Kubernetes resource.
 *
 * This function reverses the flattening performed by the search-collector, reconstructing
 * the original resource structure from the flattened search data.
 *
 * @param item - The flattened search result item from the ACM search API
 * @returns A structured Kubernetes resource object with the appropriate nested fields
 *
 * @see https://github.com/stolostron/search-collector/blob/main/pkg/transforms/genericResourceConfig.go
 */
export function convertSearchItemToResource<R extends K8sResourceCommon | K8sResourceCommon[]>(
  item: any
): R extends (infer T)[] ? Fleet<T> : Fleet<R> {
  const resource = createResourceCommon(item)

  // Reverse the flattening of specific resources by the search-collector
  const resourceKey = getResourceKey(item.kind as string, item.apigroup)
  // See https://github.com/stolostron/search-collector/blob/main/pkg/transforms/genericResourceConfig.go
  switch (resourceKey) {
    case 'ClusterServiceVersion.operators.coreos.com':
      setIfDefined(resource, 'spec.version', item.version)
      setIfDefined(resource, 'spec.displayName', item.display)
      setIfDefined(resource, 'status.phase', item.phase)
      break

    case 'ClusterOperator.config.openshift.io': {
      setIfDefined(resource, 'status.versions[0]', item.version, { name: 'operator', version: item.version })
      if (!resource.status?.conditions) {
        const conditions: any = []
        setIfDefined(conditions, `[${conditions.length}]`, item.available, {
          type: 'Available',
          status: item.available,
        })
        setIfDefined(conditions, `[${conditions.length}]`, item.progressing, {
          type: 'Progressing',
          status: item.progressing,
        })
        setIfDefined(conditions, `[${conditions.length}]`, item.degraded, {
          type: 'Degraded',
          status: item.degraded,
        })
        if (conditions.length) {
          setIfDefined(resource, 'status.conditions', conditions)
        }
      }
      break
    }

    case 'ConfigMap':
      setIfDefined(resource, 'data.spec.param.maxDesiredLatencyMilliseconds', item.configParamMaxDesiredLatency)
      setIfDefined(resource, 'data.spec.param.networkAttachmentDefinitionNamespace', item.configParamNADNamespace)
      setIfDefined(resource, 'data.spec.param.networkAttachmentDefinitionName', item.configParamNADName)
      setIfDefined(resource, 'data.spec.param.targetNode', item.configParamTargetNode)
      setIfDefined(resource, 'data.spec.param.sourceNode', item.configParamSourceNode)
      setIfDefined(resource, 'data.spec.param.sampleDurationSeconds', item.configParamSampleDuration)
      setIfDefined(resource, 'data.spec.timeout', item.configTimeout)
      setIfDefined(resource, 'data.status.completionTimestamp', item.configCompletionTimestamp)
      setIfDefined(resource, 'data.status.failureReason', item.configFailureReason)
      setIfDefined(resource, 'data.status.startTimestamp', item.configStartTimestamp)
      setIfDefined(resource, 'data.status.succeeded', item.configSucceeded)
      setIfDefined(resource, 'data.status.result.avgLatencyNanoSec', item.configStatusAVGLatencyNano)
      setIfDefined(resource, 'data.status.result.maxLatencyNanoSec', item.configStatusMaxLatencyNano)
      setIfDefined(resource, 'data.status.result.minLatencyNanoSec', item.configStatusMinLatencyNano)
      setIfDefined(resource, 'data.status.result.measurementDurationSec', item.configStatusMeasurementDuration)
      setIfDefined(resource, 'data.status.result.targetNode', item.configStatusTargetNode)
      setIfDefined(resource, 'data.status.result.sourceNode', item.configStatusSourceNode)
      break

    case 'DataImportCron.cdi.kubevirt.io':
      setIfDefined(resource, 'spec.managedDataSource', item.managedDataSource)
      break

    case 'DataSource.cdi.kubevirt.io':
      setIfDefined(resource, 'spec.source.pvc.name', item.pvcName)
      setIfDefined(resource, 'spec.source.pvc.namespace', item.pvcNamespace)
      setIfDefined(resource, 'spec.source.snapshot.name', item.snapshotName)
      setIfDefined(resource, 'spec.source.snapshot.namespace', item.snapshotNamespace)
      break

    case 'DataVolume.cdi.kubevirt.io':
      setIfDefined(resource, 'spec.source.pvc.name', item.pvcName)
      setIfDefined(resource, 'spec.source.pvc.namespace', item.pvcNamespace)
      setIfDefined(resource, 'spec.source.snapshot.name', item.snapshotName)
      setIfDefined(resource, 'spec.source.snapshot.namespace', item.snapshotNamespace)
      setIfDefined(resource, 'spec.storage.resources.requests.storage', item.size)
      setIfDefined(resource, 'spec.storage.storageClassName', item.storageClassName)
      setIfDefined(resource, 'status.phase', item.phase)
      break

    case 'Namespace':
      setIfDefined(resource, 'status.phase', item.status)
      break

    case 'Node': {
      setIfDefined(resource, 'status.addresses[0]', item.ipAddress, {
        type: 'InternalIP',
        address: item.ipAddress,
      })
      setIfDefined(resource, 'status.allocatable.memory', item.memoryAllocatable)
      setIfDefined(resource, 'status.capacity.memory', item.memoryCapacity)
      setIfDefined(resource, 'status.nodeInfo.architecture', item.architecture)
      break
    }

    case 'PersistentVolumeClaim':
      setIfDefined(resource, 'spec.resources.requests.storage', item.requestedStorage)
      setIfDefined(resource, 'spec.storageClassName', item.storageClassName)
      setIfDefined(resource, 'spec.volumeMode', item.volumeMode)
      setIfDefined(resource, 'status.phase', item.status)
      setIfDefined(resource, 'status.capacity.storage', item.capacity)
      break

    case 'StorageClass.storage.k8s.io':
      setIfDefined(resource, 'allowVolumeExpansion', item.allowVolumeExpansion)
      setIfDefined(resource, 'provisioner', item.provisioner)
      setIfDefined(resource, 'reclaimPolicy', item.reclaimPolicy)
      setIfDefined(resource, 'volumeBindingMode', item.volumeBindingMode)
      break

    case 'Subscription.operators.coreos.com':
      setIfDefined(resource, 'spec.source', item.source)
      setIfDefined(resource, 'spec.name', item.package)
      setIfDefined(resource, 'spec.channel', item.channel)
      setIfDefined(resource, 'status.installedCSV', item.installplan)
      setIfDefined(resource, 'status.state', item.phase)
      break

    case 'VirtualMachine.kubevirt.io': {
      setIfDefined(resource, 'spec.instancetype.name', item.instancetype)
      setIfDefined(resource, 'spec.preference.name', item.preference)
      setIfDefined(resource, 'spec.runStrategy', item.runStrategy)
      setIfDefined(resource, 'spec.template.spec.architecture', item.architecture)
      setIfDefined(resource, 'spec.template.spec.domain.cpu.cores', item.cpu, Number(item.cpu))
      setIfDefined(resource, 'spec.template.spec.domain.memory.guest', item.memory)
      setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/flavor"]', item.flavor)
      setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/os"]', item.osName)
      setIfDefined(resource, 'spec.template.metadata.annotations["vm.kubevirt.io/workload"]', item.workload)
      const dataVolumeNamesList = parseListString(item.dataVolumeNames)
      const pvcClaimNamesList = parseListString(item.pvcClaimNames)
      const volumes =
        dataVolumeNamesList || pvcClaimNamesList
          ? [
              ...(dataVolumeNamesList || []).map((name: string) => ({
                dataVolume: { name },
              })),
              ...(pvcClaimNamesList || []).map((claimName: string) => ({
                persistentVolumeClaim: { claimName },
              })),
            ]
          : undefined
      setIfDefined(resource, 'spec.template.spec.volumes', volumes)
      if (!resource.status?.conditions) {
        const conditions: any = []
        setIfDefined(conditions, `[${conditions.length}]`, item.ready, { type: 'Ready', status: item.ready })
        setIfDefined(conditions, `[${conditions.length}]`, item.agentConnected, {
          type: 'AgentConnected',
          status: item.agentConnected,
        })
        if (conditions.length) {
          setIfDefined(resource, 'status.conditions', conditions)
        }
      }
      setIfDefined(resource, 'status.printableStatus', item.status)
      break
    }

    case 'VirtualMachineClone.clone.kubevirt.io': {
      setIfDefined(resource, 'spec.source.name', item.sourceName)
      setIfDefined(resource, 'spec.source.kind', item.sourceKind)
      setIfDefined(resource, 'spec.target.name', item.targetName)
      setIfDefined(resource, 'spec.target.kind', item.targetKind)
      setIfDefined(resource, 'status.phase', item.phase)
      break
    }

    case 'VirtualMachineInstance.kubevirt.io': {
      setIfDefined(resource, 'spec.domain.cpu.cores', item.cpu, Number(item.cpu))
      setIfDefined(resource, 'spec.domain.cpu.sockets', item.cpuSockets, Number(item.cpuSockets))
      setIfDefined(resource, 'spec.domain.cpu.threads', item.cpuThreads, Number(item.cpuThreads))
      setIfDefined(resource, 'spec.domain.memory.guest', item.memory)
      if (!resource.status?.conditions) {
        const conditions: any = []
        setIfDefined(conditions, `[${conditions.length}]`, item.liveMigratable, {
          type: 'LiveMigratable',
          status: item.liveMigratable,
        })
        setIfDefined(conditions, `[${conditions.length}]`, item.ready, {
          type: 'Ready',
          status: item.ready,
        })
        if (conditions.length) {
          setIfDefined(resource, 'status.conditions', conditions)
        }
      }
      setIfDefined(resource, 'status.interfaces[0]', item.ipaddress, {
        ipAddress: item.ipaddress,
        name: 'default',
      })
      setIfDefined(resource, 'status.nodeName', item.node)
      setIfDefined(resource, 'status.phase', item.phase)
      setIfDefined(resource, 'status.guestOSInfo.version', item.osVersion)
      break
    }

    case 'VirtualMachineInstanceMigration.kubevirt.io':
      setIfDefined(resource, 'metadata.deletionTimestamp', item.deleted)
      setIfDefined(resource, 'status.migrationState.endTimestamp', item.endTime)
      setIfDefined(resource, 'status.migrationState.migrationPolicyName', item.migrationPolicyName)
      setIfDefined(resource, 'status.migrationState.sourceNode', item.sourceNode)
      setIfDefined(resource, 'status.migrationState.sourcePod', item.sourcePod)
      setIfDefined(resource, 'status.migrationState.targetNode', item.targetNode)
      setIfDefined(resource, 'status.phase', item.phase)
      setIfDefined(resource, 'spec.vmiName', item.vmiName)
      break

    case 'VirtualMachineInstancetype.instancetype.kubevirt.io':
    case 'VirtualMachineClusterInstancetype.instancetype.kubevirt.io':
      setIfDefined(resource, 'spec.cpu.guest', item.cpuGuest, Number(item.cpuGuest))
      setIfDefined(resource, 'spec.memory.guest', item.memoryGuest, Number(item.memoryGuest))
      break

    case 'VirtualMachineSnapshot.snapshot.kubevirt.io': {
      if (!resource.status?.conditions) {
        setIfDefined(resource, 'status.conditions[0]', item.ready, {
          type: 'Ready',
          status: item.ready,
        })
      }
      setIfDefined(resource, 'status.phase', item.phase)
      if (item.indications && typeof item.indications === 'string') {
        const indicationsArray = parseListString(item.indications)
        setIfDefined(resource, 'status.indications', indicationsArray)
      }
      setIfDefined(resource, 'spec.source.kind', item.sourceKind)
      setIfDefined(resource, 'spec.source.name', item.sourceName)
      setIfDefined(resource, 'status.readyToUse', item.readyToUse, convertToBoolean(item.readyToUse))
      break
    }

    case 'VirtualMachineRestore.snapshot.kubevirt.io': {
      if (!resource.status?.conditions) {
        setIfDefined(resource, 'status.conditions[0]', item.ready, {
          type: 'Ready',
          status: item.ready,
        })
      }
      setIfDefined(resource, 'status.restoreTime', item.restoreTime)
      setIfDefined(resource, 'status.complete', item.complete)
      setIfDefined(resource, 'spec.target.apiGroup', item.targetApiGroup)
      setIfDefined(resource, 'spec.target.kind', item.targetKind)
      setIfDefined(resource, 'spec.target.name', item.targetName)
      setIfDefined(resource, 'spec.virtualMachineSnapshotName', item.virtualMachineSnapshotName)
      break
    }

    case 'VolumeSnapshot.snapshot.storage.k8s.io':
      setIfDefined(resource, 'spec.volumeSnapshotClassName', item.volumeSnapshotClassName)
      setIfDefined(resource, 'spec.source.persistentVolumeClaimName', item.persistentVolumeClaimName)
      setIfDefined(resource, 'status.restoreSize', item.restoreSize)
      break
  }
  return resource
}

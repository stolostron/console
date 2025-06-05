/* Copyright Contributors to the Open Cluster Management project */

export type PodMetricsList = {
  kind: 'PodMetricsList'
  apiVersion: 'metrics.k8s.io/v1beta1'
  metadata: Record<string, unknown>
  items: PodMetric[]
}

type PodMetric = {
  metadata: {
    name: string
    namespace: string
    creationTimestamp: string // ISO timestamp string
    labels: Record<string, string>
  }
  timestamp: string // ISO timestamp string
  window: string // duration string e.g. "17.953s"
  containers: ContainerMetric[]
}

type ContainerMetric = {
  name: string
  usage: {
    cpu: string // e.g. "6894867n", "0"
    memory: string // e.g. "23940Ki"
  }
}

export type FilesystemlistType = {
  items: {
    diskName: string
    fileSystemType: string
    mountPoint: string
    totalBytes: number
    usedBytes: number
  }[]
  metadata: Record<string, unknown>
}

/**
 * Converts a Kubernetes CPU value from nanocores to millicores.
 * @param {string} nanocoreString - The CPU usage string, e.g., "5124125n".
 * @returns {number} The equivalent value in millicores.
 */
export function convertNanocoresToMillicores(nanocoreString: string): number {
  // Use parseInt to extract the numeric part of the string.
  // It will automatically stop at the non-numeric character 'n'.
  const nanocores = parseInt(nanocoreString, 10)

  // Check if the parsing was successful and it's a valid number.
  if (isNaN(nanocores)) {
    return 0 // Or throw an error, depending on desired behavior
  }

  // Divide by 1,000,000 to convert from nanocores to millicores.
  const millicores = nanocores / 1000000

  return millicores
}

/**
 * Parses a Kubernetes memory string (e.g., "20480Ki", "256Mi", "1.5Gi")
 * and returns the value in Mebibytes (Mi).
 * @param {string} memoryString - The memory usage string.
 * @returns {number} The equivalent value in Mebibytes.
 */
export function convertKibibytesToMebibytes(kibibyteString: string) {
  // Use parseInt to extract the numeric part of the string.
  const kibibytes = parseInt(kibibyteString, 10)

  // Check if the parsing was successful.
  if (isNaN(kibibytes)) {
    return 0 // Or throw an error
  }

  // Divide by 1024 to convert from Kibibytes to Mebibytes.
  const mebibytes = kibibytes / 1024

  return mebibytes
}

/**
 * Converts a storage value from bytes to gibibytes (GiB).
 * @param {number} bytes - The storage size in bytes.
 * @returns {number} The equivalent value in gibibytes (GiB).
 */
export function convertBytesToGibibytes(bytes: number) {
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    return 0
  }

  // The conversion factor for bytes to gibibytes (1024*1024*1024)
  const bytesInAGibibyte = 1073741824

  const gibibytes = bytes / bytesInAGibibyte

  return gibibytes
}

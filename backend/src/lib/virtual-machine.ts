/* Copyright Contributors to the Open Cluster Management project */

export type PodMetricsList = {
  kind: 'PodMetricsList'
  apiVersion: 'metrics.k8s.io/v1beta1'
  metadata: Record<string, unknown>
  items: PodMetric[]
}

export type PodMetric = {
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

export type PodListType = {
  kind: 'PodList'
  apiVersion: 'v1'
  metadata: {
    resourceVersion: string
  }
  items: PodType[]
}

export type PodType = {
  metadata: {
    name: string
  }
  spec: {
    containers: {
      resources: {
        requests: {
          cpu: string // "100m",
          memory: string // "2294Mi"
        }
      }
    }[]
  }
}

type usageMetrics = {
  requested: number // unit is millicores
  usage: number // unit is MiB
  usagePercent: number // unit is %
}

export type VmiUsageType = {
  podName: string
  vmiName: string
  clusterName: string
  namespace: string
  cpu: usageMetrics
  memory: usageMetrics
  storage: usageMetrics
}

export type FilesystemType = {
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
  const nanocores = Number.parseInt(nanocoreString, 10)

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
  const kibibytes = Number.parseInt(kibibyteString, 10)

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

/**
 * Converts a Kubernetes CPU resource string into its integer value in millicores.
 *
 * @param {string | null | undefined} cpuRequest - The CPU resource string from a Kubernetes spec (e.g., "500m", "1", "0.5").
 * @returns {number} The equivalent value in millicores.
 * @throws {Error} If the input is invalid, not a string, or in an unrecognizable format.
 */
export function toMillicores(cpuRequest: string): number {
  // 1. Validate the input
  if (cpuRequest === null || cpuRequest === undefined || typeof cpuRequest !== 'string' || cpuRequest.trim() === '') {
    throw new Error('Invalid input: cpuRequest must be a non-empty string.')
  }

  const trimmedCpu = cpuRequest.trim()

  // 2. Handle values already in millicores (ending with "m")
  if (trimmedCpu.endsWith('m')) {
    const numericPart = trimmedCpu.slice(0, -1)
    const millicores = Number.parseInt(numericPart, 10)

    // Ensure the part before "m" was a valid integer
    if (isNaN(millicores) || String(millicores) !== numericPart) {
      throw new Error(`Invalid millicore value: "${cpuRequest}". The part before "m" must be an integer.`)
    }
    return millicores
  }

  // 3. Handle values in full/fractional cores
  const coreValue = parseFloat(trimmedCpu)

  // Ensure the input was a valid number
  if (isNaN(coreValue)) {
    throw new Error(`Invalid core value: "${cpuRequest}". Must be a number or end with 'm'.`)
  }

  return coreValue * 1000
}

/**
 * Converts a Kubernetes memory resource string into its value in Mebibytes (Mi).
 *
 * @param {string | null | undefined} memoryRequest - The memory resource string from a Kubernetes spec (e.g., "128Mi", "1Gi", "500M").
 * @returns {number} The equivalent value in Mebibytes (Mi).
 * @throws {Error} If the input is invalid, not a string, or in an unrecognizable format.
 */
export function toMebibytes(memoryRequest: string): number {
  // 1. Validate the input
  if (
    memoryRequest === null ||
    memoryRequest === undefined ||
    typeof memoryRequest !== 'string' ||
    memoryRequest.trim() === ''
  ) {
    throw new Error('Invalid input: memoryRequest must be a non-empty string.')
  }

  // 2. Define conversion factors to bytes
  const BYTES_IN_A_MEBIBYTE = 1024 * 1024
  const multipliers: Record<string, number> = {
    // Binary units (power of 2)
    Ki: 1024,
    Mi: BYTES_IN_A_MEBIBYTE,
    Gi: 1024 * 1024 * 1024,
    Ti: 1024 * 1024 * 1024 * 1024,
    Pi: 1024 * 1024 * 1024 * 1024 * 1024,
    Ei: 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
    // Decimal units (power of 10)
    k: 1000,
    M: 1000 * 1000,
    G: 1000 * 1000 * 1000,
    T: 1000 * 1000 * 1000 * 1000,
    P: 1000 * 1000 * 1000 * 1000 * 1000,
    E: 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
  }

  // 3. Parse the input string
  const regex = /^(\d+(\.\d+)?)\s*([A-Za-z]+)?$/
  const match = memoryRequest.trim().match(regex)

  if (!match) {
    throw new Error(`Invalid memory format: "${memoryRequest}". Expected a number followed by an optional unit.`)
  }

  const numericValue = parseFloat(match[1])
  const unit = match[3] || '' // Default to empty string if no unit is present

  // 4. Calculate the value in bytes
  let bytes
  if (unit === '') {
    // If there's no unit, Kubernetes treats the value as bytes
    bytes = numericValue
  } else if (multipliers[unit]) {
    bytes = numericValue * multipliers[unit]
  } else {
    throw new Error(`Invalid memory unit: "${unit}".`)
  }

  // 5. Convert bytes to Mebibytes and return
  return bytes / BYTES_IN_A_MEBIBYTE
}

/**
 * Calculates the usage percentage as a whole number (integer).
 *
 * @param {number} usage - The amount of a resource that is currently being used.
 * @param {number} requested - The total amount of the resource that was requested.
 * @returns {number} The usage as a rounded, integer percentage. Returns 0 if the requested amount is 0 or invalid.
 */
export function calUsagePercent(usage: number, requested: number) {
  // --- Input Validation ---
  if (typeof usage !== 'number' || typeof requested !== 'number' || usage < 0 || requested < 0) {
    console.error("Invalid input: 'usage' and 'requested' must be non-negative numbers.")
    return 0
  }

  // --- Edge Case: Division by Zero ---
  if (requested === 0) {
    return 0
  }

  // --- Calculation and Rounding ---
  const percentage = (usage / requested) * 100

  // Round the result to the nearest whole number
  return Math.round(percentage)
}

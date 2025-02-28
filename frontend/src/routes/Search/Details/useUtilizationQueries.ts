/* Copyright Contributors to the Open Cluster Management project */

import { UseUtilizationQueries } from '../../../plugin-extensions/extensions/KubevirtContext'

enum VMQueries {
  CPU_REQUESTED = 'CPU_REQUESTED',
  CPU_USAGE = 'CPU_USAGE',
  FILESYSTEM_READ_USAGE = 'FILESYSTEM_READ_USAGE',
  FILESYSTEM_USAGE_TOTAL = 'FILESYSTEM_TOTAL_USAGE',
  FILESYSTEM_WRITE_USAGE = 'FILESYSTEM_WRITE_USAGE',
  INSTANT_MIGRATION_DATA_PROCESSED = 'INSTANT_MIGRATION_DATA_PROCESSED',
  INSTANT_MIGRATION_DATA_REMAINING = 'INSTANT_MIGRATION_DATA_REMAINING',
  MEMORY_USAGE = 'MEMORY_USAGE',
  MIGRATION_DATA_PROCESSED = 'MIGRATION_DATA_PROCESSED',
  MIGRATION_DATA_REMAINING = 'MIGRATION_DATA_REMAINING',
  MIGRATION_DISK_TRANSFER_RATE = 'MIGRATION_DISK_TRANSFER_RATE',
  MIGRATION_MEMORY_DIRTY_RATE = 'MIGRATION_MEMORY_DIRTY_RATE',
  NETWORK_IN_BY_INTERFACE_USAGE = 'NETWORK_IN_BY_INTERFACE_USAGE',
  NETWORK_IN_USAGE = 'NETWORK_IN_USAGE',
  NETWORK_OUT_BY_INTERFACE_USAGE = 'NETWORK_OUT_BY_INTERFACE_USAGE',
  NETWORK_OUT_USAGE = 'NETWORK_OUT_USAGE',
  NETWORK_TOTAL_BY_INTERFACE_USAGE = 'NETWORK_TOTAL_BY_INTERFACE_USAGE',
  NETWORK_TOTAL_USAGE = 'NETWORK_TOTAL_USAGE',
  STORAGE_IOPS_TOTAL = 'STORAGE_IOPS_TOTAL',
}

export const useUtilizationQueries: UseUtilizationQueries = (prometheusQueries, duration) => {
  let queries = prometheusQueries
  const searchParams = new URLSearchParams(decodeURIComponent(window.location.search))
  const name = searchParams.get('name')
  const namespace = searchParams.get('namespace')
  const cluster = searchParams.get('cluster')
  if (cluster) {
    // convert prometheus query to thanos query
    let query: string
    queries = {}
    const filter = `name='${name}',namespace='${namespace}',cluster='${cluster}'`
    Object.keys(prometheusQueries).map((key) => {
      switch (key) {
        case VMQueries.CPU_USAGE:
          query = `sum(rate(kubevirt_vmi_cpu_usage_seconds_total{${filter}}[${duration}])) BY (cluster, name, namespace)`
          break
        case VMQueries.CPU_REQUESTED:
          query = `sum by (cluster, namespace, name) ((last_over_time(kubevirt_vm_resource_requests{${filter},resource="cpu", unit="cores"}[${duration}])) 
          * ignoring(unit) (last_over_time(kubevirt_vm_resource_requests{${filter}, resource="cpu", unit="sockets"}[${duration}])) 
          * ignoring(unit) (last_over_time(kubevirt_vm_resource_requests{${filter}, resource="cpu", unit="threads"}[${duration}])))`
          break
        case VMQueries.FILESYSTEM_USAGE_TOTAL:
          query = `sum by (name, namespace, cluster)(rate(kubevirt_vmi_storage_iops_read_total{${filter}}[${duration}])) + 
            sum by (name, namespace, cluster)(rate(kubevirt_vmi_storage_iops_write_total{${filter}}[${duration}]))`
          break
        case VMQueries.NETWORK_OUT_USAGE:
          query = `sum by (cluster, namespace, name, node)(kubevirt_vmi_network_receive_bytes_total{${filter}})`
          break
        case VMQueries.NETWORK_IN_USAGE:
          query = `sum by (cluster, namespace, name, node)(kubevirt_vmi_network_transmit_bytes_total{${filter}})`
          break
        default:
          // for Prometheus queries, try just adding cluster label
          // add cluster label to filter ex: metric_name{.., cluster='myCluster'}
          query = prometheusQueries[key]?.replace(/\{([^}]+)\}/g, (_, key) => {
            return `{${key},cluster='${cluster}'}`
          })
          // add cluster to Aggregation operators that use "by (label list)"
          query = query.replace(/\(([^}]+)\)/g, (_, key) => {
            return `{${key}, cluster}`
          })
      }
      queries[key] = query
    })
  }
  return queries
}

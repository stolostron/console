/* Copyright Contributors to the Open Cluster Management project */

// https://github.com/openshift/hive/blob/master/docs/using-hive.md

interface ControlPlane {
  hyperthreading: 'Enabled' | 'Disable'
  name: string
  replicas: number
  platform: {
    aws?: {
      rootVolume: {
        iops: number
        size: number
        type: string
      }
      type: string
    }
    azure?: {
      osDisk: {
        diskSizeGB: number
      }
      type: string
    }
    gcp?: {
      type: string
    }
  }
}

export interface InstallConfig {
  apiVersion: string
  metadata: {
    name: string
  }
  baseDomain?: string
  controlPlane?: ControlPlane // oVirt, vsphere empty
  compute?: ControlPlane[] // oVirt, vsphere empty
  networking: {
    clusterNetwork: {
      cidr: string
      hostPrefix: number
    }[]
    machineCIDR: string
    networkType: string
    serviceNetwork: string[]
  }
  platform: {
    aws?: {
      region: string
    }

    azure?: {
      baseDomainResourceGroupName: string
      cloudName: string
      region: string
    }
    gcp?: {
      projectID: string
      region: string
    }
    ovirt?: {
      api_vip: string
      dns_vip: string
      ingress_vip: string
      ingress_vips: string[]
      ovirt_cluster_id: string
      ovirt_network_name: string
      ovirt_storage_domain_id: string
    }
    vsphere?: {
      apiVIP: string
      cluster: string
      datacenter: string
      defaultDatastore: string
      folder: string
      resourcePool: string
      ingressVIP: string
      ingressVIPs: string[]
      network: string
      password: string
      username: string
      vCenter: string
    }
  }
  pullSecret: string
  sshKey: string
}

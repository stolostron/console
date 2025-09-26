/* Copyright Contributors to the Open Cluster Management project */
interface TypeToIcon {
  [key: string]: { shape: string; className: string }
}

export const typeToIconMap: TypeToIcon = Object.freeze({
  application: {
    shape: 'application',
    className: 'design',
  },
  applicationset: {
    shape: 'application',
    className: 'design',
  },
  cluster: {
    shape: 'cluster',
    className: 'container',
  },
  clusters: {
    shape: 'cluster',
    className: 'container',
  },
  ansiblejob: {
    shape: 'ansiblejob',
    className: 'container',
  },
  configmap: {
    shape: 'configmap',
    className: 'container',
  },
  container: {
    shape: 'container',
    className: 'container',
  },
  customresource: {
    shape: 'customresource',
    className: 'container',
  },
  daemonset: {
    shape: 'daemonset',
    className: 'daemonset',
  },
  datavolume: {
    shape: 'datavolume',
    className: 'datavolume',
  },
  deployable: {
    shape: 'deployable',
    className: 'design',
  },
  deployment: {
    shape: 'deployment',
    className: 'deployment',
  },
  deploymentconfig: {
    shape: 'deploymentconfig',
    className: 'deployment',
  },
  helmrelease: {
    shape: 'chart',
    className: 'container',
  },
  host: {
    shape: 'host',
    className: 'host',
  },
  ingress: {
    shape: 'ingress',
    className: 'host',
  },
  internet: {
    shape: 'cloud',
    className: 'internet',
  },
  namespace: {
    shape: 'namespace',
    className: 'host',
  },
  node: {
    shape: 'node',
    className: 'host',
  },
  other: {
    shape: 'other',
    className: 'default',
  },
  package: {
    shape: 'chart',
    className: 'container',
  },
  placement: {
    shape: 'placement',
    className: 'design',
  },
  pod: {
    shape: 'pod',
    className: 'pod',
  },
  policy: {
    shape: 'policy',
    className: 'design',
    nodeRadius: 30,
  },
  replicaset: {
    shape: 'replicaset',
    className: 'container',
  },
  replicationcontroller: {
    shape: 'replicationcontroller',
    className: 'container',
  },
  route: {
    shape: 'route',
    className: 'container',
  },
  placements: {
    shape: 'placements',
    className: 'design',
  },
  secret: {
    shape: 'secret',
    className: 'service',
  },
  service: {
    shape: 'service',
    className: 'service',
  },
  statefulset: {
    shape: 'statefulset',
    className: 'default',
  },
  storageclass: {
    shape: 'storageclass',
    className: 'default',
  },
  subscription: {
    shape: 'subscription',
    className: 'design',
  },
  subscriptionblocked: {
    shape: 'subscriptionblocked',
    className: 'design',
  },
  virtualmachine: {
    shape: 'virtualmachine',
    className: 'virtualmachine',
  },
  virtualmachineinstance: {
    shape: 'virtualmachineinstance',
    className: 'virtualmachineinstance',
  },
})

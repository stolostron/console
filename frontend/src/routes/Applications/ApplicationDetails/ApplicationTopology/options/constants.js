/* Copyright Contributors to the Open Cluster Management project */
'use strict'

// icon for containing the cluster count
export const ClusterCountIcon = {
  icon: 'clusterCount',
  classType: 'clusterCount',
  width: 22,
  height: 18,
  dx: 26,
  dy: 0,
}

//if controller contains a pod
export const PodIcon = {
  icon: 'circle',
  classType: 'pod',
  width: 24,
  height: 24,
  dx: 0,
  dy: 0,
}

export const defaultShapes = Object.freeze({
  application: {
    shape: 'application',
    className: 'design',
    nodeRadius: 30,
  },
  applicationset: {
    shape: 'application',
    className: 'design',
    nodeRadius: 30,
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
})

export const DIAGRAM_SVG_ID = 'topologySvgId'
export const NODE_RADIUS = 28
export const NODE_SIZE = 50
export const MINIMUM_ZOOM_FIT = 0.4 // auto zoom to fit won't drop below this scale
export const RELATED_OPACITY = 0.3 // opacity of elements related to matched elements

export const FilterResults = Object.freeze({
  nosearch: '', // no search in progress
  match: 'match', // match
  hidden: 'hidden', // doesn't match
  related: 'related', //related to match
  matched: 'matched', // a previous match--used when out of search mode
})

export const StatusIcon = Object.freeze({
  success: {
    icon: 'success',
    classType: 'success',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  error: {
    icon: 'failure',
    classType: 'failure',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  running: {
    icon: 'running',
    classType: 'success',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  pending: {
    icon: 'pending',
    classType: 'warning',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  spinner: {
    icon: 'spinner',
    classType: 'warning',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  warning: {
    icon: 'warning',
    classType: 'warning',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
})

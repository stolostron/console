/* Copyright Contributors to the Open Cluster Management project */

import {
  ContextProvider,
  Perspective,
  NavSection,
  HrefNavItem,
  RoutePage,
  ResourceDetailsPage,
  ResourceNSNavItem,
  CreateResource,
} from '@openshift-console/dynamic-plugin-sdk'
import { SharedContext } from '../../src/lib/SharedContext'
import { EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack'

/**
 * Defines Multicluster Engine UI integration points with OpenShift Console.
 * Provides core multicluster functionality extensions including cluster lifecycle management.
 * Extends console with cluster provisioning, importing, and monitoring features.
 */

// Context Provider - type: 'console.context-provider'
const contextProvider: EncodedExtension<ContextProvider> = {
  type: 'console.context-provider',
  properties: {
    provider: { $codeRef: 'contextProvider.PluginDataContextProvider' },
    useValueHook: { $codeRef: 'context.usePluginDataContextValue' },
  },
}

// Shared Context - enables React context sharing across plugins via 'acm.shared-context' type
const sharedContext: EncodedExtension<SharedContext> = {
  type: 'acm.shared-context',
  properties: {
    id: 'mce-data-context',
    context: { $codeRef: 'context.PluginDataContext' },
  },
}

// Perspective - type: 'console.perspective'
const perspective: EncodedExtension<Perspective> = {
  type: 'console.perspective',
  properties: {
    id: 'acm',
    name: '%plugin__mce~Fleet Management%',
    icon: { $codeRef: 'perspective.icon' },
    landingPageURL: { $codeRef: 'perspective.getLandingPageURL' },
    importRedirectURL: { $codeRef: 'perspective.getImportRedirectURL' },
  },
}

// Infrastructure Section - type: 'console.navigation/section'
const infrastructureSection: EncodedExtension<NavSection> = {
  type: 'console.navigation/section',
  properties: {
    id: 'mce-infrastructure',
    perspective: 'acm',
    name: '%plugin__mce~Infrastructure%',
  },
}

// Clusters Navigation Item - type: 'console.navigation/href'
const clustersNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    section: 'mce-infrastructure',
    id: 'mce-clusters',
    name: '%plugin__mce~Clusters%',
    href: '/multicloud/infrastructure/clusters',
  },
}

// Clusters Route - type: 'console.page/route'
const clustersRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/infrastructure/clusters',
    component: { $codeRef: 'clusters.default' },
  },
}

// Automations Navigation Item - type: 'console.navigation/href'
const automationsNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    section: 'mce-infrastructure',
    id: 'mce-automations',
    name: '%plugin__mce~Automation%',
    href: '/multicloud/infrastructure/automations',
  },
}

// Automations Route - type: 'console.page/route'
const automationsRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/infrastructure/automations',
    component: { $codeRef: 'automations.default' },
  },
}

// Virtual Machines Navigation Item - type: 'console.navigation/href'
const virtualMachinesNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    section: 'mce-infrastructure',
    id: 'mce-virtual-machines',
    name: '%plugin__mce~Virtual machines%',
    href: '/multicloud/infrastructure/virtualmachines',
  },
}

// Virtual Machines Route - type: 'console.page/route'
const virtualMachinesRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/infrastructure/virtualmachines',
    component: { $codeRef: 'virtualmachines.default' },
  },
  flags: {
    disallowed: ['KUBEVIRT_DYNAMIC_ACM'],
  },
}

// Virtual Machines Detail Route - type: 'console.page/route'
const virtualMachinesDetailRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/infrastructure/virtualmachines/:cluster/:namespace/:name', // with parameters
    component: { $codeRef: 'vmRedirect.default' }, // points to VMRedirect
  },
  flags: {
    disallowed: ['KUBEVIRT_DYNAMIC_ACM'],
  },
}

// Credentials Navigation Item - type: 'console.navigation/href'
const credentialsNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    id: 'mce-credentials',
    name: '%plugin__mce~Credentials%',
    href: '/multicloud/credentials',
  },
}

// Credentials Route - type: 'console.page/route'
const credentialsRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/credentials',
    component: { $codeRef: 'credentials.default' },
  },
}

const infraEnvDetails: EncodedExtension<ResourceDetailsPage> = {
  type: 'console.page/resource/details',
  properties: {
    model: {
      group: 'agent-install.openshift.io',
      version: 'v1beta1',
      kind: 'InfraEnv',
    },
    component: { $codeRef: 'cim.InfraEnvDetails' },
  },
}

const infraEnvRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: [
      'k8s/all-namespaces/agent-install.openshift.io~v1beta1~InfraEnv',
      'k8s/ns/:ns/agent-install.openshift.io~v1beta1~InfraEnv',
    ],
    component: { $codeRef: 'environments.default' },
    exact: true,
  },
}

const infraEnvNavItem: EncodedExtension<ResourceNSNavItem> = {
  type: 'console.navigation/resource-ns',
  properties: {
    id: 'mce-host-inventory',
    perspective: 'acm',
    model: {
      group: 'agent-install.openshift.io',
      version: 'v1beta1',
      kind: 'InfraEnv',
    },
    section: 'mce-infrastructure',
    name: '%plugin__mce~Host inventory%',
    insertAfter: 'mce-automations',
  },
}

const infraEnvCreate: EncodedExtension<CreateResource> = {
  type: 'console.resource/create',
  properties: {
    model: {
      group: 'agent-install.openshift.io',
      version: 'v1beta1',
      kind: 'InfraEnv',
    },
    component: { $codeRef: 'cim.CreateInfraEnvPage' },
  },
}

export const extensions: EncodedExtension[] = [
  contextProvider,
  sharedContext,
  perspective,
  infrastructureSection,
  clustersNavItem,
  clustersRoute,
  automationsNavItem,
  automationsRoute,
  virtualMachinesNavItem,
  virtualMachinesDetailRoute,
  virtualMachinesRoute,
  credentialsNavItem,
  credentialsRoute,
  infraEnvDetails,
  infraEnvRoute,
  infraEnvNavItem,
  infraEnvCreate,
]

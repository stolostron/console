/* Copyright Contributors to the Open Cluster Management project */

import { NavSection, HrefNavItem, RoutePage, FeatureFlagHookProvider } from '@openshift-console/dynamic-plugin-sdk'
import { EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack'

/**
 * Defines UI extension points for Advanced Cluster Management integration.
 * Includes cluster management views, navigation items, and dashboards.
 * Extends the OpenShift Console with multicluster visualization and management capabilities.
 */

// Navigation section for ACM Home
const homeSection: EncodedExtension<NavSection> = {
  type: 'console.navigation/section',
  properties: {
    perspective: 'acm',
    id: 'acm-home',
    name: '%plugin__acm~Home%',
    insertBefore: 'acm-search',
  },
}

// Welcome page navigation link
const welcomeNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    section: 'acm-home',
    id: 'acm-welcome',
    name: '%plugin__acm~Welcome%',
    href: '/multicloud/home/welcome',
  },
}

// Welcome page route definition
const welcomeRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/home/welcome',
    component: { $codeRef: 'welcome.default' },
    perspective: 'acm',
  },
}

// Overview page navigation link
const overviewNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    section: 'acm-home',
    id: 'acm-overview',
    name: '%plugin__acm~Overview%',
    href: '/multicloud/home/overview',
  },
}

// Overview page route definition
const overviewRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/home/overview',
    component: { $codeRef: 'overview.default' },
    perspective: 'acm',
  },
}

// Search page navigation link
const searchNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    id: 'acm-search',
    name: '%plugin__acm~Search%',
    href: '/multicloud/search',
    insertBefore: 'mce-infrastructure',
  },
}

// Search page route definition
const searchRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/search',
    component: { $codeRef: 'search.default' },
    perspective: 'acm',
  },
}

// Alternative search page route
const altSearchRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/home/search',
    component: { $codeRef: 'search.default' },
    perspective: 'acm',
  },
}

// Applications page navigation link
const applicationsNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    id: 'acm-applications',
    name: '%plugin__acm~Applications%',
    href: '/multicloud/applications',
    insertBefore: 'mce-credentials',
  },
}

// Applications page route definition
const applicationsRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/applications',
    component: { $codeRef: 'applications.default' },
    perspective: 'acm',
  },
}

// Governance page navigation link
const governanceNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    id: 'acm-governance',
    name: '%plugin__acm~Governance%',
    href: '/multicloud/governance',
    insertBefore: 'mce-credentials',
  },
}

// Governance page route definition
const governanceRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/governance',
    component: { $codeRef: 'governance.default' },
    perspective: 'acm',
  },
}

// Flag hook provider to enable/disable feature flags
const hookProvider: EncodedExtension<FeatureFlagHookProvider> = {
  type: 'console.flag/hookProvider',
  properties: {
    handler: { $codeRef: 'featureFlags.default' },
  },
}

// Access Control Management navigation link
const accessControlNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    id: 'acm-accessControlManagement',
    name: '%plugin__acm~Access control%',
    href: '/multicloud/access-control-management',
    insertAfter: 'mce-credentials',
  },
  flags: {
    required: ['ACM_ACCESS_CONTROL_MANAGEMENT'],
  },
}

// Access Control Management route definition
const accessConrolRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/access-control-management',
    component: { $codeRef: 'accessControlManagement.default' },
    perspective: 'acm',
  },
  flags: {
    required: ['ACM_ACCESS_CONTROL_MANAGEMENT'],
  },
}

// User Management navigation section
const userManagementSection: EncodedExtension<NavSection> = {
  type: 'console.navigation/section',
  properties: {
    perspective: 'acm',
    id: 'acm-user-management',
    name: '%plugin__acm~User Management%',
    insertAfter: 'acm-accessControlManagement',
  },
}

// Roles navigation item
const rolesNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    section: 'acm-user-management',
    id: 'acm-roles',
    name: '%plugin__acm~Roles%',
    href: '/multicloud/roles',
  },
}

// Roles page route definition
const rolesRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/roles',
    component: { $codeRef: 'roles.default' },
    perspective: 'acm',
  },
}

// Identities navigation item
const identitiesNavItem: EncodedExtension<HrefNavItem> = {
  type: 'console.navigation/href',
  properties: {
    perspective: 'acm',
    section: 'acm-user-management',
    id: 'acm-identities',
    name: '%plugin__acm~Identities%',
    href: '/multicloud/identities',
  },
}

// Identities page route definition
const identitiesRoute: EncodedExtension<RoutePage> = {
  type: 'console.page/route',
  properties: {
    path: '/multicloud/identities',
    component: { $codeRef: 'identities.default' },
    perspective: 'acm',
  },
}

export const extensions: EncodedExtension[] = [
  homeSection,
  welcomeNavItem,
  welcomeRoute,
  overviewNavItem,
  overviewRoute,
  searchNavItem,
  searchRoute,
  altSearchRoute,
  applicationsNavItem,
  applicationsRoute,
  governanceNavItem,
  governanceRoute,
  hookProvider,
  accessControlNavItem,
  accessConrolRoute,
  userManagementSection,
  rolesNavItem,
  rolesRoute,
  identitiesNavItem,
  identitiesRoute,
]

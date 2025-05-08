/* Copyright Contributors to the Open Cluster Management project */

/**
 * Defines UI extension points for Advanced Cluster Management integration.
 * Includes cluster management views, navigation items, and dashboards.
 * Extends the OpenShift Console with multicluster visualization and management capabilities.
 */

type EncodedExtension = {
    type: string
    properties: Record<string, any>
  }

export const extensions: EncodedExtension[] = [
    {
        // Navigation section for ACM Home
        type: 'console.navigation/section',
        properties: {
            perspective: 'acm',
            id: 'acm-home',
            name: '%plugin__acm~Home%',
            insertBefore: 'acm-search'
        }
    },
    {
        // Welcome page navigation link
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            section: 'acm-home',
            id: 'acm-welcome',
            name: '%plugin__acm~Welcome%',
            href: '/multicloud/home/welcome'
        }
    },
    {
        // Welcome page route definition
        type: 'console.page/route',
        properties: {
            path: '/multicloud/home/welcome',
            component: { $codeRef: 'welcome.default' }
        }
    },
    {
        // Overview page navigation link
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            section: 'acm-home',
            id: 'acm-overview',
            name: '%plugin__acm~Overview%',
            href: '/multicloud/home/overview'
        }
    },
    {
        // Overview page route definition
        type: 'console.page/route',
        properties: {
            path: '/multicloud/home/overview',
            component: { $codeRef: 'overview.default' }
        }
    },
    {
        // Search page navigation link
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            id: 'acm-search',
            name: '%plugin__acm~Search%',
            href: '/multicloud/search',
            insertBefore: 'mce-infrastructure'
        }
    },
    {
        // Search page route definition
        type: 'console.page/route',
        properties: {
            path: '/multicloud/search',
            component: { $codeRef: 'search.default' }
        }
    },
    {
        // Alternative search page route
        type: 'console.page/route',
        properties: {
            path: '/multicloud/home/search',
            component: { $codeRef: 'search.default' }
        }
    },
    {
        // Applications page navigation link
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            id: 'acm-applications',
            name: '%plugin__acm~Applications%',
            href: '/multicloud/applications',
            insertBefore: 'mce-credentials'
        }
    },
    {
        // Applications page route definition
        type: 'console.page/route',
        properties: {
            path: '/multicloud/applications',
            component: { $codeRef: 'applications.default' }
        }
    },
    {
        // Governance page navigation link
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            id: 'acm-governance',
            name: '%plugin__acm~Governance%',
            href: '/multicloud/governance',
            insertBefore: 'mce-credentials'
        }
    },
    {
        // Governance page route definition
        type: 'console.page/route',
        properties: {
            path: '/multicloud/governance',
            component: { $codeRef: 'governance.default' }
        }
    }
  ]
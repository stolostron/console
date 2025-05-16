/* Copyright Contributors to the Open Cluster Management project */

/**
 * Defines Multicluster Engine UI integration points with OpenShift Console.
 * Provides core multicluster functionality extensions including cluster lifecycle management.
 * Extends console with cluster provisioning, importing, and monitoring features.
 */
type EncodedExtension = {
    type: string
    properties: Record<string, any>
  }
  
export const extensions: EncodedExtension[] = [
    {
        type: 'console.context-provider',
        properties: {
            provider: { $codeRef: 'contextProvider.PluginDataContextProvider' },
            useValueHook: { $codeRef: 'context.usePluginDataContextValue' }
        }
    },
    {
        type: 'acm.shared-context',
        properties: {
            id: 'mce-data-context',
            context: { $codeRef: 'context.PluginDataContext' }
        }
    },
    {
        type: 'console.perspective',
        properties: {
            id: 'acm',
            name: '%plugin__mce~All clusters%',
            icon: { $codeRef: 'perspective.icon' },
            landingPageURL: { $codeRef: 'perspective.getLandingPageURL' },
            importRedirectURL: { $codeRef: 'perspective.getImportRedirectURL' }
        }
    },
    {
        type: 'console.navigation/section',
        properties: {
            id: 'mce-infrastructure',
            perspective: 'acm',
            name: '%plugin__mce~Infrastructure%'
        }
    },
    {
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            section: 'mce-infrastructure',
            id: 'mce-clusters',
            name: '%plugin__mce~Clusters%',
            href: '/multicloud/infrastructure/clusters'
        }
    },
    {
        type: 'console.page/route',
        properties: {
            path: '/multicloud/infrastructure/clusters',
            component: { $codeRef: 'clusters.default' }
        }
    },
    {
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            section: 'mce-infrastructure',
            id: 'mce-automations',
            name: '%plugin__mce~Automation%',
            href: '/multicloud/infrastructure/automations'
        }
    },
    {
        type: 'console.page/route',
        properties: {
            path: '/multicloud/infrastructure/automations',
            component: { $codeRef: 'automations.default' }
        }
    },
    {
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            section: 'mce-infrastructure',
            id: 'mce-host-inventory',
            name: '%plugin__mce~Host inventory%',
            href: '/multicloud/infrastructure/environments'
        }
    },
    {
        type: 'console.page/route',
        properties: {
            path: '/multicloud/infrastructure/environments',
            component: { $codeRef: 'environments.default' }
        }
    },
    {
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            section: 'mce-infrastructure',
            id: 'mce-virtual-machines',
            name: '%plugin__mce~Virtual machines%',
            href: '/multicloud/infrastructure/virtualmachines'
        }
    },
    {
        type: 'console.page/route',
        properties: {
            path: '/multicloud/infrastructure/virtualmachines',
            component: { $codeRef: 'virtualmachines.default' }
        }
    },
    {
        type: 'console.navigation/href',
        properties: {
            perspective: 'acm',
            id: 'mce-credentials',
            name: '%plugin__mce~Credentials%',
            href: '/multicloud/credentials'
        }
    },
    {
        type: 'console.page/route',
        properties: {
            path: '/multicloud/credentials',
            component: { $codeRef: 'credentials.default' }
        }
    }
]
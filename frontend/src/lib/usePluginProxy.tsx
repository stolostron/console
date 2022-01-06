/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'

type ConsolePluginProxyServiceKind = {
    type: string
    name: string
    namespace: string
    port: string
}

type ConsolePluginKind = K8sResourceCommon & {
    spec: {
        displayName: string
        service: {
            basePath: string
            name: string
            namespace: string
            port: number
        }
        proxy?: ConsolePluginProxyServiceKind[]
    }
}

export function usePluginProxy() {
    const [data, loaded, error] = useK8sWatchResource<ConsolePluginKind>({
        groupVersionKind: {
            group: 'console.openshift.io',
            version: 'v1alpha1',
            kind: 'ConsolePlugin',
        },
        isList: false,
        name: 'acm-plugin',
    })

    const proxyService = loaded && data.spec.proxy && data.spec.proxy[0]
    if (loaded && proxyService) {
        window.acmConsolePluginProxyPath = `/api/proxy/namespace/${proxyService.namespace}/service/${proxyService.name}:${proxyService.port}`
    }
    return loaded || error
}

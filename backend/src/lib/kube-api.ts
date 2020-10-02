import { KubeConfig } from '@kubernetes/client-node'
import * as k8s from '@kubernetes/client-node'

export function getTokenKubeConfig(token: string): KubeConfig {
    const kubeConfig = new KubeConfig()
    const cluster = {
        name: 'my-cluster',
        server: process.env.CLUSTER_API_URL,
        skipTLSVerify: true,
    }

    const user = {
        name: 'my-user',
        token,
    }

    const context = {
        name: 'my-context',
        user: user.name,
        cluster: cluster.name,
    }

    kubeConfig.loadFromOptions({
        clusters: [cluster],
        users: [user],
        contexts: [context],
        currentContext: context.name,
    })
    return kubeConfig
}

export function getCoreV1API(token: string): k8s.CoreV1Api {
    const kubeConfig = getTokenKubeConfig(token)
    return kubeConfig.makeApiClient(k8s.CoreV1Api)
}

export function getCustomObjectsApi(token: string): k8s.CustomObjectsApi {
    const kubeConfig = getTokenKubeConfig(token)
    return kubeConfig.makeApiClient(k8s.CustomObjectsApi)
}

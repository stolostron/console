import { ConfigMapApiVersion, ConfigMapKind, getResource } from '../resources'

/* Copyright Contributors to the Open Cluster Management project */
function api<T>(url: string, headers?: Record<string, unknown>): Promise<T> {
    return fetch(url, headers).then((response) => {
        if (!response.ok) {
            throw new Error(response.statusText)
        }
        return response.json() as Promise<T>
    })
}

export function launchToOCP(urlSuffix: string, newTab: boolean, onError?: VoidFunction) {
    const resourceResult = getResource({
        apiVersion: ConfigMapApiVersion,
        kind: ConfigMapKind,
        metadata: {
            name: 'console-public',
            namespace: 'openshift-config-managed',
        },
    }).promise

    resourceResult
        .then((response: any) => {
            if (newTab) {
                window.open(`${response.data.consoleURL}/${urlSuffix}`)
            } else {
                location.href = `${response.data.consoleURL}/${urlSuffix}`
            }
        })
        .catch((err: any) => {
            onError?.()
            // eslint-disable-next-line no-console
            console.error(err)
        })
}

export function checkOCPVersion(switcherExists: (arg0: boolean) => void) {
    if (process.env.NODE_ENV === 'test') return
    api<{ gitVersion: string }>('/multicloud/version/')
        .then(({ gitVersion }) => {
            if (parseFloat(gitVersion.substr(1, 4)) >= 1.2) {
                switcherExists(true)
            } else {
                switcherExists(false)
            }
        })
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
            switcherExists(false)
        })
}

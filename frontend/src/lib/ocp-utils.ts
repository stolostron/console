/* Copyright Contributors to the Open Cluster Management project */
function api<T>(url: string, headers?: Record<string, unknown>): Promise<T> {
    return fetch(url, headers).then((response) => {
        if (!response.ok) {
            throw new Error(response.statusText)
        }
        return response.json() as Promise<T>
    })
}

export function launchToOCP(urlSuffix: string, newTab: boolean) {
    api<{ data: { consoleURL: string } }>(
        '/multicloud/api/v1/namespaces/openshift-config-managed/configmaps/console-public/'
    )
        .then(({ data }) => {
            if (newTab) {
                window.open(`${data.consoleURL}/${urlSuffix}`)
            } else {
                location.href = `${data.consoleURL}/${urlSuffix}`
            }
        })
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
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

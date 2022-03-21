/* Copyright Contributors to the Open Cluster Management project */

import {
    BareMetalAsset,
    createBareMetalAssetResource,
    createBareMetalAssetSecret,
    createProject,
    getSecret,
    ImportedBareMetalAsset,
    IResource,
    listBareMetalAssets,
    patchResource,
    Secret,
} from '../resources'
import yaml from 'js-yaml'
import { get, keyBy, set } from 'lodash'

const INSTALL_CONFIG = 'install-config.yaml'
const BMC_USERNAME = 'bmc.username'
const BMC_PASSWORD = 'bmc.password'
const CREDENTIAL_NAME = 'spec.bmc.credentialsName'
const CREDENTIAL_NAMESPACE = 'metadata.namespace'

export async function syncBMAs(hosts: ImportedBareMetalAsset[], resources: IResource[]) {
    // make sure all hosts have a bare metal asset
    // (bma's may have been imported from a csv)
    let results
    const assets: BareMetalAsset[] = []
    const errors: Error[] = []
    const response = await listBareMetalAssets().promise
    const assetsMap = keyBy(response, (item) => {
        const name = get(item, 'metadata.name')
        const namespace = get(item, 'metadata.namespace')
        return `${name}-${namespace}`
    })
    const newAssets: ImportedBareMetalAsset[] = []
    hosts.forEach((host) => {
        const { name, namespace } = host
        const asset = assetsMap[`${name}-${namespace}`]
        if (!asset) {
            newAssets.push(host)
        } else {
            assets.push(asset)
        }
    })
    if (newAssets.length > 0) {
        await createBMAs(newAssets, assets, errors)
    }

    // make sure all hosts have a user/password in both ClusterDeployment and install-config.yaml
    const hostsWithoutCred = hosts.filter((host) => !get(host, BMC_USERNAME))
    const installConfig = (resources as Secret[]).find(({ data }) => data && data[INSTALL_CONFIG])
    if (installConfig?.data) {
        const installConfigData = yaml.load(Buffer.from(installConfig.data[INSTALL_CONFIG], 'base64').toString('ascii'))
        const installConfigHosts = get(installConfigData, 'platform.baremetal.hosts', [])
        const installConfigHostsWithoutCred = installConfigHosts.filter((host: any) => !get(host, BMC_USERNAME))
        if (hostsWithoutCred.length > 0 || installConfigHostsWithoutCred.length > 0) {
            results = hostsWithoutCred.map(({ namespace, name }) => {
                const asset = assetsMap[`${name}-${namespace}`]
                return !asset
                    ? { promise: Promise.resolve() }
                    : getSecret({ namespace: get(asset, CREDENTIAL_NAMESPACE), name: get(asset, CREDENTIAL_NAME) })
            })
            const secrets = await Promise.allSettled(results.map((result) => result.promise))
            const secretMap = keyBy(secrets, (secret) => {
                const name = get(secret, 'value.metadata.name')
                const namespace = get(secret, 'value.metadata.namespace')
                return `${name}-${namespace}`
            })
            const setSecrets = (fhosts: any[]) => {
                fhosts.forEach((host) => {
                    const { name, namespace, bootMACAddress } = host
                    const installConfigHost = installConfigHostsWithoutCred.find(
                        (h: any) => h.name === name && h.bootMACAddress === bootMACAddress
                    )
                    const asset = assetsMap[`${name}-${namespace}`]
                    const credName = get(asset, 'spec.bmc.credentialsName', name)
                    const secret = secretMap[`${credName}-${namespace}`]
                    if (secret) {
                        const { username, password } = get(secret, 'value.data', {})
                        const setCreds = (host: any) => {
                            set(
                                host,
                                BMC_USERNAME,
                                username ? Buffer.from(username, 'base64').toString('ascii') : undefined
                            )
                            set(
                                host,
                                BMC_PASSWORD,
                                password ? Buffer.from(password, 'base64').toString('ascii') : undefined
                            )
                        }
                        setCreds(host)
                        if (installConfigHost) {
                            setCreds(installConfigHost)
                        }
                    }
                })
            }
            setSecrets(hostsWithoutCred)
            if (installConfigHostsWithoutCred.length > 0) {
                installConfig.data[INSTALL_CONFIG] = Buffer.from(yaml.dump(installConfigData)).toString('base64')
            }
        }
    }
    return { assets, errors }
}

export async function attachBMAs(
    assets: BareMetalAsset[],
    hosts: ImportedBareMetalAsset[],
    clusterName: string,
    errors: Error[]
) {
    // mark asset as being used by this cluster
    const results = assets.map((asset, inx) => {
        const patch = {
            spec: {
                role: hosts[inx].role,
                clusterDeployment: {
                    name: clusterName,
                    namespace: clusterName,
                },
            },
        }
        return patchResource(asset, patch)
    })
    const response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach((result) => {
        if (result.status === 'rejected') {
            errors.push({ name: 'attachBMA', message: result.reason.message })
        }
    })
}

export async function importBMAs() {
    return new Promise<ImportedBareMetalAsset[]>((resolve, reject) => {
        const input = document.createElement('input')
        input.setAttribute('id', 'importBMAs')
        input.type = 'file'
        input.accept = '.csv, .txt'
        input.style.visibility = 'hidden'
        const body = document.querySelector('body')
        body?.appendChild(input)
        input.onchange = (e: Event) => {
            input.remove()
            const target = e.target as HTMLInputElement
            const file: File = (target.files as FileList)[0]
            const reader = new FileReader()
            reader.readAsText(file, 'UTF-8')
            reader.onload = async (readerEvent) => {
                const content = readerEvent.target?.result

                // parse csv
                if (typeof content === 'string') {
                    await new Promise((r) => setTimeout(r, 100))
                    const allTextLines = content.split(/\r\n|\n/)
                    const headers = allTextLines.shift()
                    if (headers) {
                        const header = headers.split(',')
                        if (header.length > 3) {
                            const lines: string[] = []
                            allTextLines.forEach((line) => {
                                const data = line.split(',')
                                if (data.length === header.length) {
                                    const arr: string[] = []
                                    header.forEach((header, inx) => {
                                        arr.push(`"${header.trim()}": "${data[inx].trim()}"`)
                                    })
                                    lines.push(`{${arr.join(',')}}`)
                                }
                            })

                            try {
                                let bmas = JSON.parse(`[${lines.join(',')}]`)
                                bmas = bmas.map((bma: any) => {
                                    return {
                                        name: bma.hostName,
                                        namespace: bma.hostNamespace,
                                        bootMACAddress: bma.macAddress,
                                        role: bma.role,
                                        uid: `${bma.hostNamespace}/${bma.hostName}`,
                                        bmc: {
                                            address: bma.bmcAddress,
                                            username: bma.username,
                                            password: bma.password,
                                        },
                                    } as ImportedBareMetalAsset
                                })

                                resolve(bmas)
                            } catch (err) {
                                reject(err)
                            }
                        }
                    }
                }
            }
        }
        input.click()
    })
}

export async function createBMAs(bmas: any[], assets: BareMetalAsset[] = [], errors: Error[] = []) {
    let results
    let response
    // determine the namespaces required and create them
    const namespaces = Object.keys(keyBy(bmas, 'namespace'))
    results = namespaces.map((namespace) => createProject(namespace))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach((result) => {
        if (result.status === 'rejected') {
            if (result.reason.code !== 409) {
                errors.push({ name: 'create BMA namespaces', message: result.reason.message })
            }
        }
    })

    // create the bma and its secret
    results = bmas.map((asset) => createBareMetalAssetSecret(asset))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach((result) => {
        if (result.status === 'rejected') {
            errors.push({ name: 'create BMA secret', message: result.reason.message })
        }
    })
    results = bmas.map((asset) => createBareMetalAssetResource(asset))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach((result) => {
        if (result.status === 'rejected') {
            errors.push({ name: 'create BMA resource', message: result.reason.message })
        } else {
            assets.push(result.value)
        }
    })
    return { assets, errors }
}

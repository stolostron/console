import {
    createBareMetalAssetResource,
    createBareMetalAssetSecret,
    listBareMetalAssets,
} from '../resources/bare-metal-asset'
import { getSecret } from '../resources/secret'
import { createProject } from '../resources/project'
import { patchResource } from '../lib/resource-request'
import { set, get, keyBy } from 'lodash'
import yaml from 'js-yaml'

const INSTALL_CONFIG = 'install-config.yaml'
const BMC_USERNAME = 'bmc.username'
const BMC_PASSWORD = 'bmc.password'
const CREDENTIAL_NAME = 'spec.bmc.credentialsName'
const CREDENTIAL_NAMESPACE = 'metadata.namespace'

export async function syncBMAs(hosts: JsonArray, resources: JsonArray) {
    // make sure all hosts have a bare metal asset
    // (bma's may have been imported from a csv)
    let results
    const assets = []
    const errors = []
    let response = await listBareMetalAssets().promise
    const assetsMap = keyBy(response, (item) => {
        const name = get(item, 'metadata.name')
        const namespace = get(item, 'metadata.namespace')
        return `${name}-${namespace}`
    })
    const newAssets = []
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
    const installConfig = resources.find(({ data }) => data && data[INSTALL_CONFIG])
    const installConfigData = yaml.safeLoad(Buffer.from(installConfig.data[INSTALL_CONFIG], 'base64').toString('ascii'))
    const installConfigHosts = get(installConfigData, 'platform.baremetal.hosts', [])
    const installConfigHostsWithoutCred = installConfigHosts.filter((host) => !get(host, BMC_USERNAME))
    if (hostsWithoutCred.length > 0 || installConfigHostsWithoutCred.length > 0) {
        results = hostsWithoutCred.map(({ namespace, name }) => {
            const asset = assetsMap[`${name}-${namespace}`]
            return !asset
                ? Promise.resolve()
                : getSecret({ namespace: get(asset, CREDENTIAL_NAMESPACE), name: get(asset, CREDENTIAL_NAME) })
        })
        const secrets = await Promise.allSettled(results.map((result) => result.promise))
        const secretMap = keyBy(secrets, (secret) => {
            const name = get(secret, 'value.metadata.name')
            const namespace = get(secret, 'value.metadata.namespace')
            return `${name}-${namespace}`
        })
        const setSecrets = (fhosts) => {
            fhosts.forEach((host) => {
                const { name, namespace } = host
                const asset = assetsMap[`${name}-${namespace}`]
                const credName = get(asset, 'spec.bmc.credentialsName', name)
                const secret = secretMap[`${credName}-${namespace}`]
                if (secret) {
                    const { username, password } = get(secret, 'value.data', {})
                    set(host, BMC_USERNAME, username ? Buffer.from(username, 'base64').toString('ascii') : undefined)
                    set(host, BMC_PASSWORD, password ? Buffer.from(password, 'base64').toString('ascii') : undefined)
                }
            })
        }
        setSecrets(hostsWithoutCred)
        setSecrets(installConfigHostsWithoutCred)
        if (installConfigHostsWithoutCred.length > 0) {
            installConfig.data[INSTALL_CONFIG] = Buffer.from(yaml.safeDump(installConfigData)).toString('base64')
        }
    }
    return { assets, errors }
}

export async function attachBMAs(assets: JsonArray, hosts: JsonArray, clusterName: string, errors: JsonArray) {
    // mark asset as being used by this cluster
    let results = assets.map((asset, inx) => {
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
    response.forEach(({ status, reason }, inx) => {
        if (status === 'rejected') {
            errors.push({ message: reason.message })
        }
    })
}

export async function importBMAs() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv, .txt'
        input.onchange = (e) => {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.readAsText(file, 'UTF-8')
            reader.onload = async (readerEvent) => {
                const content = readerEvent.target.result

                // parse csv
                setTimeout(() => {
                    const allTextLines = content.split(/\r\n|\n/)
                    const headers = allTextLines.shift().split(',')
                    if (headers.length > 3) {
                        const lines = []
                        allTextLines.forEach((line) => {
                            const data = line.split(',')
                            if (data.length === headers.length) {
                                const arr = []
                                headers.forEach((header, inx) => {
                                    arr.push(`"${header.trim()}": "${data[inx].trim()}"`)
                                })
                                arr.push(`"id": "${Math.random().toString()}"`)
                                lines.push(`{${arr.join(',')}}`)
                            }
                        })

                        try {
                            let bmas = JSON.parse(`[${lines.join(',')}]`)
                            bmas = bmas.map((bma) => {
                                return {
                                    name: bma.hostName,
                                    namespace: bma.hostNamespace,
                                    bootMACAddress: bma.macAddress,
                                    role: bma.role,
                                    uid: `${Math.random().toString()}`,
                                    bmc: {
                                        address: bma.bmcAddress,
                                        username: bma.username,
                                        password: bma.password,
                                    },
                                }
                            })

                            resolve(bmas)
                        } catch (err) {
                            reject(err)
                        }
                    }
                }, 100)
            }
        }
        input.click()
    })
}

export async function createBMAs(bmas: JsonArray, assets = [], errors = []) {
    let results
    let response
    // determine the namespaces required and create them
    const namespaces = Object.keys(keyBy(bmas, 'namespace'))
    results = namespaces.map((namespace) => createProject(namespace))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach(({ status, reason }, inx) => {
        if (status === 'rejected') {
            if (reason.code !== 409) {
                errors.push({ message: reason.message })
            }
        }
    })

    // create the bma and its secret
    results = bmas.map((asset) => createBareMetalAssetSecret(asset))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach(({ status, reason, value }, inx) => {
        if (status === 'rejected') {
            errors.push({ message: reason.message, item: bmas[inx] })
        }
    })
    results = bmas.map((asset) => createBareMetalAssetResource(asset))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach(({ status, reason, value }, inx) => {
        if (status === 'rejected') {
            errors.push({ message: reason.message, item: bmas[inx] })
        } else {
            assets.push(value)
        }
    })
    return { assets, errors }
}

import {
    createBareMetalAssetResource,
    createBareMetalAssetSecret,
    listBareMetalAssets,
} from '../resources/bare-metal-asset'
import { createProject } from '../resources/project'
import { patchResource } from '../lib/resource-request'
import { get, keyBy } from 'lodash'

export async function syncBMAs(hosts: JsonArray, resources: JsonArray) {
    // make sure all hosts have a bare metal asset
    // (bma's may have been imported from a csv)
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
        // determine the namespaces required and create them
        const namespaces = Object.keys(keyBy(newAssets, 'namespace'))
        let results = namespaces.map((namespace) => createProject(namespace))
        response = await Promise.allSettled(results.map((result) => result.promise))
        response.forEach(({ status, reason }, inx) => {
            if (status === 'rejected') {
                if (reason.code !== 409) {
                    errors.push({ message: reason.message })
                }
            }
        })

        // create the bma and its secret
        results = newAssets.map((asset) => createBareMetalAssetSecret(asset))
        response = await Promise.allSettled(results.map((result) => result.promise))
        response.forEach(({ status, reason, value }, inx) => {
            if (status === 'rejected') {
                errors.push({ message: reason.message })
            }
        })
        results = newAssets.map((asset) => createBareMetalAssetResource(asset))
        response = await Promise.allSettled(results.map((result) => result.promise))
        response.forEach(({ status, reason, value }, inx) => {
            if (status === 'rejected') {
                errors.push({ message: reason.message })
            } else {
                assets.push(value)
            }
        })
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

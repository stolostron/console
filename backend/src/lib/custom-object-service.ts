import { V1ObjectMeta } from '@kubernetes/client-node'
import { Resource } from '../entities/common/resource'
import { getCustomObjectsApi } from './kube-api'
import { logError, logger } from './logger'

export class CustomObjectService<T extends Resource> {
    constructor(public readonly options: { plural: string; group: string; version: string }) {}
    async query(token: string, fieldSelector?: string, labelSelector?: string): Promise<T[]> {
        const customObjectsApi = getCustomObjectsApi(token)
        // eslint-disable-next-line @typescript-eslint/ban-types
        const response = await customObjectsApi.listClusterCustomObject(
            this.options.group,
            this.options.version,
            this.options.plural,
            undefined,
            undefined,
            fieldSelector,
            labelSelector
        )
        const body = response.body as { items: T[] }
        return Promise.resolve(body.items)
    }

    async get(token: string, name: string, namespace: string): Promise<T> {
        const customObjectsApi = getCustomObjectsApi(token)
        // eslint-disable-next-line @typescript-eslint/ban-types
        const response: { body: object } = await customObjectsApi.getNamespacedCustomObject(
            this.options.group,
            this.options.version,
            namespace,
            this.options.plural,
            name
        )
        return Promise.resolve(response.body as T)
    }

    async create(
        token: string,
        resource: {
            metadata?: V1ObjectMeta
            [key: string]: unknown
        }
    ): Promise<T> {
        try {
            const result = await createCustomObject<T>(token, this.options, resource)
            logger.info({ msg: 'created custom object', plural: this.options.plural, group: this.options.group })
            return result
        } catch (err) {
            logError('create custom object error', err)
            throw err
        }
    }
}

export async function createCustomObject<T>(
    token: string,
    options: {
        group: string
        version: string
        plural: string
    },
    resource: {
        metadata?: V1ObjectMeta
        [key: string]: unknown
    }
): Promise<T> {
    const customObjectsApi = getCustomObjectsApi(token)
    // eslint-disable-next-line @typescript-eslint/ban-types
    const response: { body: object } = await customObjectsApi.createNamespacedCustomObject(
        options.group,
        options.version,
        resource.metadata.namespace,
        options.plural,
        resource
    )
    return Promise.resolve((response.body as unknown) as T)
}

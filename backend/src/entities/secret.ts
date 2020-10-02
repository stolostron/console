import { V1Secret } from '@kubernetes/client-node'
import { Arg, Ctx, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import { getCoreV1API } from '../lib/kube-api'
import { logError, logger } from '../lib/logger'
import { IUserContext } from '../lib/user-context'
import { Resource } from './common/resource'

export class SecretsService<T extends Secret> {
    async query(token: string, fieldSelector?: string, labelSelector?: string): Promise<T[]> {
        const coreV1API = getCoreV1API(token)
        const response = await coreV1API.listSecretForAllNamespaces(undefined, undefined, fieldSelector, labelSelector)
        return (response.body.items as unknown) as T[]
    }

    async delete(token: string, name: string, namespace: string): Promise<boolean> {
        const coreV1API = getCoreV1API(token)
        await coreV1API.deleteNamespacedSecret(name, namespace)
        return true
    }

    async createSecret(
        token: string,
        options: {
            name: string
            namespace: string
            stringData?: Record<string, string>
            data?: Record<string, string>
            type?: string
            dryRun?: boolean
        }
    ): Promise<V1Secret> {
        const secret: V1Secret = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: { name: options.name, namespace: options.namespace },
            stringData: options.stringData,
            type: options.type ? options.type : 'Opaque',
        }
        const coreV1API = getCoreV1API(token)
        try {
            const result = await coreV1API.createNamespacedSecret(
                options.namespace,
                secret,
                undefined,
                options.dryRun ? 'All' : undefined
            )
            logger.info({ msg: 'secret created', name: options.name, namespace: options.namespace })
            return result.body
        } catch (err) {
            logError('create secret error', err, { name: options.name, namespace: options.namespace })
            throw err
        }
    }
}
export const secretService = new SecretsService<Secret>()

@ObjectType()
export class Secret extends Resource {}

@Resolver(/* istanbul ignore next */ (of) => Secret)
export class SecretResolver {
    @Query((returns) => [Secret])
    secrets(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<Secret[]> {
        return secretService.query(userContext.token, fieldSelector, labelSelector)
    }

    @Mutation((returns) => Boolean)
    deleteSecret(
        @Ctx() userContext: IUserContext,
        @Arg('name') name: string,
        @Arg('namespace') namespace: string
    ): Promise<boolean> {
        return secretService.delete(userContext.token, name, namespace)
    }
}

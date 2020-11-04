import nock from 'nock'
import { IResource, IResourceMethods } from './Resource'

export function nockList<Resource>(
    resourceMethods: IResourceMethods<Resource>,
    resources: Resource[],
    labels?: string[]
) {
    let networkMock = nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true }).get(
        `/cluster-management/namespaced${resourceMethods.apiPath}/${resourceMethods.plural}`
    )

    if (labels) {
        networkMock = networkMock.query({
            labelSelector: encodeURIComponent(labels.join(',')),
        })
    }

    return networkMock.reply(
        200,
        {
            items: resources,
        },
        {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        }
    )
}

export function nockClusterList<Resource>(
    resourceMethods: IResourceMethods<Resource>,
    resources: Resource[],
    labels?: string[]
) {
    let networkMock = nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true }).get(
        `/cluster-management/proxy${resourceMethods.apiPath}/${resourceMethods.plural}`
    )

    if (labels) {
        networkMock = networkMock.query({
            labelSelector: encodeURIComponent(labels.join(',')),
        })
    }

    return networkMock.reply(
        200,
        {
            items: resources,
        },
        {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        }
    )
}

export function nockDelete(resourceMethods: IResourceMethods<any>, resource: IResource) {
    return nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true })
        .options(
            `/cluster-management/proxy${resourceMethods.apiPath}/namespaces/${resource.metadata!.namespace}/${
                resourceMethods.plural
            }/${resource.metadata!.name}`
        )
        .optionally()
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
        .delete(
            `/cluster-management/proxy${resourceMethods.apiPath}/namespaces/${resource.metadata!.namespace}/${
                resourceMethods.plural
            }/${resource.metadata!.name}`
        )
        .reply(204, undefined, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        })
}

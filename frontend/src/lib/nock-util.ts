import nock from 'nock'
import { IResource, IResourceMethods } from './Resource'
import { Project } from './Project'

export function nockListProjects(
    projects:Array<Project>
) {
    let networkMock = nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true }).get(
        '/cluster-management/proxy/apis/project.openshift.io/v1/projects'
    )

    return networkMock.reply(
        200,
        {
            items: projects,
        },
        {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        }
    )
}

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

export function nockCreate(resourceMethods: IResourceMethods<any>, resource: IResource, response: IResource) {
    const isNamespaceScoped = !!resource.metadata?.namespace
    const url = `/cluster-management/proxy${resourceMethods.apiPath}${isNamespaceScoped ? `/namespaces/${resource.metadata?.namespace}`: ''}/${resourceMethods.plural}`
    
    return nock(process.env.REACT_APP_BACKEND as string)
        .post(url, JSON.stringify(resource))
        .reply(201, response,
            {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

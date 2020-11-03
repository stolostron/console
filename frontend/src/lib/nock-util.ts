import nock from 'nock'

export function nockList<Resource>(path: string, plural: string, resources: Resource[], labels?: string[]) {
    let networkMock = nock(process.env.REACT_APP_BACKEND as string, { encodedQueryParams: true }).get(
        `/cluster-management/namespaced${path}/${plural}`
    )

    if (labels) {
        networkMock = networkMock.query({
            labelSelector: encodeURIComponent(labels.join(',')),
        })
    }

    networkMock.reply(
        200,
        {
            items: resources,
        },
        {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        }
    )
}

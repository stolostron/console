import { createHash } from 'crypto'
import { IncomingMessage, request as httpRequest, RequestOptions } from 'http'
import { Agent } from 'https'
import { parse as parseUrl } from 'url'
import {
    ManagedClusterAction,
    ManagedClusterActionApiGroup,
    ManagedClusterActionApiVersion,
    ManagedClusterActionKind,
    ManagedClusterActionResources,
    ManagedClusterActionVersion,
} from './managedclusteraction'
import {
    ManagedClusterView,
    ManagedClusterViewApiGroup,
    ManagedClusterViewApiVersion,
    ManagedClusterViewKind,
    ManagedClusterViewResources,
    ManagedClusterViewVersion,
} from './managedclusterview'

interface KubernetesGVR {
    apiGroup: string
    version: string
    resources: string
}
interface namespacedName {
    name: string
    namespace: string
}
interface requestOptions {
    host: string
    token: string
    agent: Agent
}
type verifyStatusFn<T> = (
    response: IncomingMessage
) => Promise<{
    isValid: boolean
    isRetryRequired: boolean
    retData?: T
    code?: number
    msg?: string
}>
export interface requestException {
    code: number
    msg: string
}

const pollInterval = 2000

const gvrManagedClusterView: KubernetesGVR = {
    apiGroup: ManagedClusterViewApiGroup,
    version: ManagedClusterViewVersion,
    resources: ManagedClusterViewResources,
}

const gvrManagedClusterAction: KubernetesGVR = {
    apiGroup: ManagedClusterActionApiGroup,
    version: ManagedClusterActionVersion,
    resources: ManagedClusterActionResources,
}

export function parseBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('error', reject)
        req.on('data', (chunk) => (data += chunk))
        req.on('end', () => {
            resolve(data)
        })
    })
}

export async function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
    const body = await parseBody(req)
    return JSON.parse(body) as T
}

// get resources on local cluster
export function getResource(opt: requestOptions, gvr: KubernetesGVR, nsn: namespacedName): Promise<IncomingMessage> {
    const headers = { authorization: `Bearer ${opt.token}`, host: opt.host }
    const options: RequestOptions = {
        ...parseUrl(
            `${process.env.CLUSTER_API_URL}/apis/${gvr.apiGroup}/${gvr.version}/namespaces/${nsn.namespace}/${gvr.resources}/${nsn.name}`
        ),
        ...{ method: 'GET', headers, agent: opt.agent },
    }

    return new Promise<IncomingMessage>((resolve) => {
        const getReq = httpRequest(options, (response) => {
            resolve(response)
        })
        getReq.end()
    })
}

export function deleteResource(opt: requestOptions, gvr: KubernetesGVR, nsn: namespacedName): Promise<IncomingMessage> {
    const headers = { authorization: `Bearer ${opt.token}`, host: opt.host }
    const options: RequestOptions = {
        ...parseUrl(
            `${process.env.CLUSTER_API_URL}/apis/${gvr.apiGroup}/${gvr.version}/namespaces/${nsn.namespace}/${gvr.resources}/${nsn.name}`
        ),
        ...{ method: 'DELETE', headers, agent: opt.agent },
    }

    return new Promise<IncomingMessage>((resolve) => {
        const getReq = httpRequest(options, (response) => {
            resolve(response)
        })
        getReq.end()
    })
}
function createResource<T>(
    opt: requestOptions,
    gvr: KubernetesGVR,
    nsn: namespacedName,
    obj: T
): Promise<IncomingMessage> {
    const postData = JSON.stringify(obj)
    const options: RequestOptions = {
        ...parseUrl(
            `${process.env.CLUSTER_API_URL}/apis/${gvr.apiGroup}/${gvr.version}/namespaces/${nsn.namespace}/${gvr.resources}/${nsn.name}`
        ),
        ...{ method: 'POST', agent: opt.agent },
        headers: {
            authorization: `Bearer ${opt.token}`,
            host: opt.host,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData),
        },
    }

    return new Promise<IncomingMessage>((resolve) => {
        const postReq = httpRequest(options, (response) => {
            resolve(response)
        })
        postReq.write(postData)
        postReq.end()
    })
}
// pollResource poll the given resource every pollInterval ms
// polling will stop if verifyStatus function returns valid or no need of retry
// will reject if not valid or hit some error
// it will use code & msg from verifyStatus function when reject
function pollResource<T>(
    opt: requestOptions,
    gvr: KubernetesGVR,
    nsn: namespacedName,
    pollInterval: number,
    verifyStatus: verifyStatusFn<T>,
    maxPollTimes: number
): { poll: Promise<T>; cancel: () => void } {
    if (maxPollTimes < 1) {
        maxPollTimes = 1
    }
    let currPoll = 0
    let pollVersions: NodeJS.Timeout
    const cancel = () => {
        if (pollVersions) {
            clearInterval(pollVersions)
            pollVersions = undefined
        }
    }
    const poll = new Promise<T>((resolve, reject) => {
        pollVersions = setInterval(async () => {
            console.log('waiting for interval setting')
            try {
                console.log('before get')
                const resGet = await getResource(opt, gvr, nsn)

                const { isValid, isRetryRequired, retData, code, msg } = await verifyStatus(resGet)
                if (isValid) {
                    resolve(retData)
                    cancel()
                } else if (!isRetryRequired) {
                    reject({ code, msg })
                    cancel()
                }
            } catch (err) {
                reject(err)
                cancel()
            }
            currPoll++
            if (currPoll > maxPollTimes) {
                reject({ code: 500, msg: '{"message":"request timeout"}' })
            }
        }, pollInterval)
    })

    return { poll, cancel }
}

// createPollHelper does get->create->poll->verify->delete operation on a resource
// if object exist, will not create but poll directly
// if something goes wrong when doing requests, will thow an error in requestException format
async function createPollHelper<TRet, TPoll>(
    opt: requestOptions,
    gvr: KubernetesGVR,
    nsn: namespacedName,
    obj: TPoll,
    pollInterval: number,
    verifyStatus: verifyStatusFn<TRet>,
    maxPollTimes: number
): Promise<TRet> {
    // check if a mcv is already exist
    const getRes = await getResource(opt, gvr, nsn)
    if (getRes.statusCode === 404) {
        // create if not found
        const createRes = await createResource<TPoll>(opt, gvr, nsn, obj)
        if (createRes.statusCode == 409) {
            const createResponse = await parseJsonBody<{ reason: string }>(createRes)
            // if existed, will keep progress
            if ('AlreadyExists' !== createResponse.reason) {
                console.log('unexpected error')
                throw { code: 409, msg: JSON.stringify(createResponse) }
            }
        } else if (!(createRes.statusCode >= 200 && createRes.statusCode < 300)) {
            const createResponse = await parseBody(createRes)
            throw { code: createRes.statusCode, msg: createResponse }
        }
    }
    //polling & return
    const { poll, cancel } = pollResource(opt, gvr, nsn, pollInterval, verifyStatus, maxPollTimes)

    let retData = undefined
    // when failed, poll will throw error in requestException format
    try {
        retData = await poll
    } catch (err) {
        cancel()
        throw err
    }
    cancel()
    //delete, the result doesn't matter for users
    deleteResource(opt, gvr, nsn)
        .then(() => {
            console.log('deleted')
        })
        .catch((err) => console.log(err))
    return retData
}

// getRemoteResource uses managedclusterview to get resources on remote cluster
// a managedclusterview will be created
// the managedclusterview is ephemeraland, and it will be destroyed once we get resource from status
export async function getRemoteResource<T>(
    host: string,
    token: string,
    agent: Agent,
    clusterName: string,
    apiGroup: string,
    version: string,
    resources: string,
    kind: string,
    name: string,
    namespace: string,
    pollInterval: number,
    maxPollTimes: number
): Promise<T> {
    const opt: requestOptions = { host, token, agent }
    const gvr: KubernetesGVR = { apiGroup, version, resources }
    const nsn: namespacedName = { name, namespace }
    const viewName = createHash('sha1')
        .update(`${clusterName}-${resources}-${namespace}-${name}`)
        .digest('hex')
        .substr(0, 63)

    const view: ManagedClusterView = {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: {
            labels: {
                name: viewName,
                'console.open-cluster-management.io/view': 'true',
            },
            name: viewName,
            namespace: clusterName,
        },
        spec: {
            scope: {
                name,
                apiGroup,
                kind,
                version,
                namespace: namespace,
            },
        },
    }
    // only approve when we detected conditions has a type=processing, and will return status.result
    const verifyStatus: verifyStatusFn<T> = async (response: IncomingMessage) => {
        try {
            const viewObj = await parseJsonBody<ManagedClusterView>(response)
            if (response.statusCode >= 200 && response.statusCode < 300) {
                if (viewObj.status.conditions[0].type === 'Processing' && viewObj.status) {
                    const retData = viewObj.status.result as T
                    return {
                        isValid: true,
                        isRetryRequired: false,
                        retData,
                        code: response.statusCode,
                    }
                } else {
                    return { isValid: false, isRetryRequired: true }
                }
            } else {
                return {
                    isValid: false,
                    isRetryRequired: false,
                    code: response.statusCode,
                    msg: JSON.stringify(viewObj),
                }
            }
        } catch (err) {
            console.log(err)
            throw { code: 500, msg: '' } as requestException
        }
    }

    return await createPollHelper<T, ManagedClusterView>(
        opt,
        gvrManagedClusterView,
        { name: viewName, namespace: clusterName },
        view,
        pollInterval,
        verifyStatus,
        maxPollTimes
    )
}

// updateRemoteResource uses managedclusteraction to update remote resources
// managedclusteractions are ephemeral, and will be deleted after the work is done
// if action failed, will return msg of the action
export async function updateRemoteResource(
    host: string,
    token: string,
    agent: Agent,
    clusterName: string,
    resources: string,
    name: string,
    namespace: string,
    body: Record<string, unknown>,
    pollInterval: number,
    maxPollTimes: number
): Promise<unknown> {
    const opt: requestOptions = { host, token, agent }
    const actionName = createHash('sha1')
        .update(`${clusterName}-${resources}-${namespace}-${name}`)
        .digest('hex')
        .substr(0, 63)
    const action: ManagedClusterAction = {
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: {
            name: actionName,
            namespace: clusterName,
        },
        spec: {
            actionType: 'Update',
            kube: {
                resource: resources,
                name: name,
                namespace: namespace,
                template: body,
            },
        },
    }

    const verifyStatus: verifyStatusFn<unknown> = async (response: IncomingMessage) => {
        try {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                const actionObj = await parseJsonBody<ManagedClusterAction>(response)
                if (actionObj.status.conditions[0].type === 'Completed') {
                    const status = actionObj.status.conditions[0].status
                    // only accept type=completed & status=true
                    if (status.toLocaleLowerCase() === 'true') {
                        return { isValid: true, isRetryRequired: false }
                    } else {
                        // failed, return msg
                        return {
                            isValid: false,
                            isRetryRequired: false,
                            code: 500,
                            msg: actionObj.status.conditions[0].message ?? 'failed to apply resource update',
                        }
                    }
                } else {
                    // not ready yet, retry
                    return { isValid: false, isRetryRequired: true }
                }
            }
            // wrong status code, return error
            const msg = await parseBody(response)
            return {
                isValid: false,
                isRetryRequired: false,
                code: response.statusCode,
                msg: msg,
            }
        } catch (err) {
            console.log(err)
            throw { code: 500, msg: '' } as requestException
        }
    }
    return await createPollHelper<unknown, ManagedClusterAction>(
        opt,
        gvrManagedClusterAction,
        { name: actionName, namespace: clusterName },
        action,
        pollInterval,
        verifyStatus,
        maxPollTimes
    )
}

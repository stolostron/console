/* Copyright Contributors to the Open Cluster Management project */

import { createPollHelper, getRemoteResource, updateRemoteResource, verifyStatusFn } from '../../src/lib/utils'
import * as nock from 'nock'
import { IncomingMessage } from 'http'
import { assert } from 'console'
import { Agent } from 'https'
import { parseBody } from '../../src/lib/body-parser'

const initNock = (
    path: string | RegExp,
    isExisted: boolean,
    hasGetError: boolean,
    hasPostError: boolean,
    hasDeleteError: boolean,
    hasCreateConflict: boolean,
    getResultOld: string,
    getResultNew: string,
    delayGetResultTimes: number,
    hasDelayGetError: boolean
) => {
    let isCreated: boolean = isExisted
    let getDelay: number = delayGetResultTimes
    let isDeleted = false
    let getTimes = 0
    let createTimes = 0
    let deleteTimes = 0
    nock.cleanAll()
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.enableNetConnect('localhost')

    nock(/example\.com/)
        .persist()
        .get('/.well-known/oauth-authorization-server')
        .optionally()
        .reply(200, {
            authorization_endpoint: 'https://example.com/auth',
            token_endpoint: 'https://example.com/token',
        })
    // handle get
    nock(/example\.com/)
        .persist()
        .get(path)
        .reply(() => {
            getTimes++
            getDelay--
            let retData = getResultOld
            if (getDelay < 0) {
                retData = getResultNew
            }

            if (hasGetError || (hasDelayGetError && getDelay < 0)) {
                return [500, 'unexpected error']
            }
            if (isCreated) {
                return [200, retData]
            }
            return [404, '{"message":"not found"}']
        })
    // handle create
    nock(/example\.com/)
        .persist()
        .post(path)
        .reply(() => {
            createTimes++
            if (hasPostError) {
                return [500, 'unexpected error']
            } else if (hasCreateConflict) {
                return [409, '{"reason":"AlreadyExists"}']
            }
            isCreated = true
            return [200, getResultOld]
        })
    // handle delete
    nock(/example\.com/)
        .persist()
        .delete(path)
        .reply(() => {
            deleteTimes++
            if (hasDeleteError) {
                return [500, 'unexpected error']
            }
            isDeleted = true
            return [200, 'ok']
        })

    // return a function for checking current status
    return () => {
        return { isDeleted, getTimes, deleteTimes, createTimes }
    }
}

describe('createPollHelper', () => {
    const gvr = { apiGroup: 'test.open-cluster-management.io', version: 'v99', resources: 'testresources' }
    const nsn = { name: 'testname', namespace: 'testnamespace' }
    const path = `/apis/${gvr.apiGroup}/${gvr.version}/namespaces/${nsn.namespace}/${gvr.resources}/${nsn.name}`
    const oldResult = 'old'
    const newResult = 'new'
    const agent = new Agent()
    const verifyStatus: verifyStatusFn<string> = async (response: IncomingMessage) => {
        const resData = await parseBody(response)
        if (resData.toString() === newResult) {
            return { isValid: true, isRetryRequired: false, retData: newResult }
        }
        return { isValid: false, isRetryRequired: true }
    }
    const verifyStatusError: verifyStatusFn<string> = async (response: IncomingMessage) => {
        const resData = await parseBody(response)
        return { isValid: false, isRetryRequired: false, code: 500, message: 'wrong' }
    }
    it('should create resource if does not exist, and should delete', async () => {
        const checkResult = initNock(path, false, false, false, false, false, oldResult, newResult, 2, false)
        try {
            const retData = await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatus,
                5
            )
            expect(retData).toBe(newResult)
        } catch (err) {
            assert(!err)
        }
        expect(checkResult().createTimes).toBe(1)
        expect(checkResult().getTimes).toBeGreaterThan(1)
        expect(checkResult().getTimes).toBeLessThan(5)
        expect(checkResult().deleteTimes).toBeGreaterThan(0)
        expect(checkResult().isDeleted).toBe(true)
    })
    it('should not create resource if exists, and should delete', async () => {
        const checkResult = initNock(path, true, false, false, false, false, oldResult, newResult, 2, false)
        try {
            const retData = await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatus,
                5
            )
            expect(retData).toBe(newResult)
        } catch (err) {
            assert(!err)
        }
        expect(checkResult().createTimes).toBe(0)
        expect(checkResult().getTimes).toBeGreaterThan(1)
        expect(checkResult().getTimes).toBeLessThan(5)
        expect(checkResult().deleteTimes).toBeGreaterThan(0)
        expect(checkResult().isDeleted).toBe(true)
    })
    it('should always delete when polling timeout', async () => {
        let hasError = false
        const checkResult = initNock(path, false, false, false, false, false, oldResult, newResult, 999, false)
        try {
            await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatus,
                5
            )
        } catch (err) {
            hasError = true
        }
        assert(hasError)
        expect(checkResult().createTimes).toBe(1)
        expect(checkResult().getTimes).toBeGreaterThan(1)
        expect(checkResult().getTimes).toBeLessThan(8)
        expect(checkResult().deleteTimes).toBeGreaterThan(0)
        expect(checkResult().isDeleted).toBe(true)
    })
    it('should return error when failed to get', async () => {
        initNock(path, false, true, false, false, false, oldResult, newResult, 2, false)
        let hasError = false
        try {
            await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatus,
                5
            )
        } catch (err) {
            hasError = true
        }
        assert(hasError)
    })
    it('should return error when failed to create', async () => {
        initNock(path, false, false, true, false, false, oldResult, newResult, 2, false)
        let hasError = false
        try {
            await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatus,
                5
            )
        } catch (err) {
            hasError = true
        }
        assert(hasError)
    })
    it('should keep processing if create hit already exists error', async () => {
        initNock(path, false, false, false, false, true, oldResult, newResult, 2, false)
        let hasError = false
        try {
            const retData = await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatus,
                5
            )
            expect(retData).toBe(newResult)
        } catch (err) {
            hasError = true
        }
        assert(!hasError)
    })
    it('should return error if no result after poll attempts', async () => {
        initNock(path, false, false, false, false, false, oldResult, newResult, 10, false)
        let hasError = false
        try {
            await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatus,
                5
            )
        } catch (err) {
            hasError = true
        }
        assert(hasError)
    })
    it('should return error if verify function returns error', async () => {
        initNock(path, false, false, false, false, false, oldResult, newResult, 2, false)
        let hasError = false
        try {
            await createPollHelper<string, string>(
                { host: 'test.test', token: 'randomtoken', agent: agent },
                gvr,
                nsn,
                oldResult,
                50,
                verifyStatusError,
                5
            )
        } catch (err) {
            hasError = true
        }
        assert(hasError)
    })
})

describe('getRemoteResource', () => {
    const path = /\/apis\/view\.open-cluster-management\.io\/v1beta1/
    const remoteObj = {
        apiVersion: 'test.console.open-cluster-management.io/v99',
        kind: 'ConsoleTest',
        metadata: {
            name: 'ConsoleTest',
            namespace: 'namespace',
        },
        spec: { data: 'somerandomdata' },
    }
    const oldResult = JSON.stringify({
        apiVersion: 'view.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterView',
        metadata: {
            labels: {
                name: 'viewname',
                'console.open-cluster-management.io/view': 'true',
            },
            name: 'viewName',
            namespace: 'clusterName',
        },
        spec: {
            scope: {
                name: 'name',
                apiGroup: 'apiGroup',
                kind: 'kind',
                version: 'version',
                namespace: 'namespace',
            },
        },
        status: {},
    })
    const newResult = JSON.stringify({
        apiVersion: 'view.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterView',
        metadata: {
            labels: {
                name: 'viewname',
                'console.open-cluster-management.io/view': 'true',
            },
            name: 'viewName',
            namespace: 'clusterName',
        },
        spec: {
            scope: {
                name: 'name',
                apiGroup: 'test.console.open-cluster-management.io',
                kind: 'ConsoleTest',
                version: 'v99',
                namespace: 'namespace',
            },
        },
        status: {
            conditions: [{ type: 'Processing', status: 'True' }],
            result: remoteObj,
        },
    })
    nock(process.env.CLUSTER_API_URL)
        .get('/apis/')
        .reply(200, () => {
            return 'ok'
        })
    it('should return remote resource when working properly', async () => {
        initNock(path, false, false, false, false, false, oldResult, newResult, 2, false)
        try {
            const retObj = await getRemoteResource<Record<string, unknown>>(
                'example.coom',
                'token',
                new Agent(),
                'clusterName',
                'test.console.open-cluster-management.io',
                'v99',
                'consoletests',
                'ConsoleTest',
                'name',
                'namespace',
                50,
                5
            )
            expect((retObj?.spec as Record<string, string>).data).toBe('somerandomdata')
        } catch (err) {
            assert(false)
        }
    })
    it('should return error if result is always empty', async () => {
        initNock(path, false, false, false, false, false, oldResult, newResult, 999, false)
        try {
            const retObj = await getRemoteResource<Record<string, unknown>>(
                'example.coom',
                'token',
                new Agent(),
                'clusterName',
                'test.console.open-cluster-management.io',
                'v99',
                'consoletests',
                'ConsoleTest',
                'name',
                'namespace',
                50,
                3
            )
            assert(false)
        } catch (err) {
            assert(!!err)
        }
    })
})

describe('updateRemoteResource', () => {
    const path = /\/apis\/action\.open-cluster-management\.io\/v1beta1/
    const oldAction = JSON.stringify({
        apiVersion: 'action.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterAction',
        metadata: {
            name: 'actionName',
            namespace: 'clusterName',
        },
        spec: {
            actionType: 'Update',
            kube: {
                resource: 'resources',
                name: 'name',
                namespace: 'namespace',
                template: {},
            },
        },
    })
    const newAction = JSON.stringify({
        apiVersion: 'action.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterAction',
        metadata: {
            name: 'actionName',
            namespace: 'clusterName',
        },
        spec: {
            actionType: 'Update',
            kube: {
                resource: 'resources',
                name: 'name',
                namespace: 'namespace',
                template: {},
            },
        },
        status: {
            conditions: [{ type: 'Completed', status: 'True' }],
        },
    })
    const newActionFail = JSON.stringify({
        apiVersion: 'action.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterAction',
        metadata: {
            name: 'actionName',
            namespace: 'clusterName',
        },
        spec: {
            actionType: 'Update',
            kube: {
                resource: 'resources',
                name: 'name',
                namespace: 'namespace',
                template: {},
            },
        },
        status: {
            conditions: [{ type: 'Completed', status: 'False' }],
        },
    })
    it('should resolve if remote resouces are updated', async () => {
        initNock(path, false, false, false, false, false, oldAction, newAction, 2, false)
        try {
            await updateRemoteResource(
                'example.coom',
                'token',
                new Agent(),
                'clusterName',
                'consoletests',
                'name',
                'namespace',
                {},
                50,
                3
            )
            assert(true)
        } catch (err) {
            assert(false)
        }
    })
    it('should return error if failed to update', async () => {
        initNock(path, false, false, false, false, false, oldAction, newActionFail, 2, false)
        try {
            await updateRemoteResource(
                'example.coom',
                'token',
                new Agent(),
                'clusterName',
                'consoletests',
                'name',
                'namespace',
                {},
                50,
                3
            )
            assert(false)
        } catch (err) {
            assert(!!err)
        }
    })
    it('should return error if result is always empty', async () => {
        initNock(path, false, false, false, false, false, oldAction, newAction, 999, false)
        try {
            await updateRemoteResource(
                'example.coom',
                'token',
                new Agent(),
                'clusterName',
                'consoletests',
                'name',
                'namespace',
                {},
                50,
                3
            )
            assert(false)
        } catch (err) {
            assert(!!err)
        }
    })
})

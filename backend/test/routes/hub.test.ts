/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import type { IResource } from '../../src/resources/resource'
import { cacheResource, resetResourceCache } from '../../src/routes/events'
import { request } from '../mock-request'

function mockCrdNock(url: string) {
  const apisScope = nock(url).get('/apis').reply(200, { status: 200 })
  const crdScope = nock(url)
    .get('/apis/apiextensions.k8s.io/v1/customresourcedefinitions')
    .reply(200, {
      items: [
        {
          kind: 'CustomResourceDefinition',
          apiVersion: 'apiextensions.k8s.io/v1',
          metadata: {
            name: 'multiclusterglobalhubs.operator.open-cluster-management.io',
          },
        },
      ],
    })
  return { apisScope, crdScope }
}

describe('global hub', function () {
  afterEach(() => resetResourceCache())

  it('should return authentication without claimMappings when auth type is not OIDC', async function () {
    const { apisScope, crdScope } = mockCrdNock(process.env.CLUSTER_API_URL)
    const res = await request('GET', '/hub')
    expect(res.statusCode).toEqual(200)
    const parsed = await parsePipedJsonBody(res)
    expect(parsed).toEqual({
      localHubName: 'local-cluster',
      isGlobalHub: true,
      isHubSelfManaged: false,
      isObservabilityInstalled: false,
      authentication: {
        isDirectAuthenticationEnabled: false,
      },
    })
    apisScope.done()
    crdScope.done()
  })

  it('should return claimMappings when auth type is OIDC', async function () {
    await cacheResource(
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'Authentication',
        metadata: { uid: 'auth-uid', name: 'cluster' },
        spec: {
          type: 'OIDC',
          oidcProviders: [
            {
              claimMappings: {
                username: { claim: 'email', prefix: { prefixString: 'oidc:' }, prefixPolicy: 'Prefix' },
                groups: { claim: 'groups', prefix: 'oidc:' },
              },
            },
          ],
        },
      } as IResource,
      false
    )

    const { apisScope, crdScope } = mockCrdNock(process.env.CLUSTER_API_URL)
    const res = await request('GET', '/hub')
    expect(res.statusCode).toEqual(200)
    const parsed = await parsePipedJsonBody(res)
    expect(parsed).toEqual({
      localHubName: 'local-cluster',
      isGlobalHub: true,
      isHubSelfManaged: false,
      isObservabilityInstalled: false,
      authentication: {
        isDirectAuthenticationEnabled: true,
        claimMappings: {
          username: { claim: 'email', prefix: { prefixString: 'oidc:' }, prefixPolicy: 'Prefix' },
          groups: { claim: 'groups', prefix: 'oidc:' },
        },
      },
    })
    apisScope.done()
    crdScope.done()
  })
})

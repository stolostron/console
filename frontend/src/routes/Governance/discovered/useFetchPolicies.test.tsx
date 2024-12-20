/* Copyright Contributors to the Open Cluster Management project */
import { useFetchPolicies } from './useFetchPolicies'
import { renderHook } from '@testing-library/react-hooks'
import { RecoilRoot } from 'recoil'

//
// mock useSearchResultItemsAndRelatedItemsQuery
jest.mock('../../Search/search-sdk/search-sdk', () => ({
  useSearchResultItemsAndRelatedItemsQuery: jest.fn(() => {
    return {
      data: { searchResult: [{ items }] },
      loading: false,
    }
  }),
}))

//
// mock worker
global.URL.createObjectURL = jest.fn()
type MessageHandler = (msg: string) => void
let onceIsEnough = false

class Worker {
  url: string
  terminate: () => void
  onmessage: MessageHandler
  constructor(stringUrl: string) {
    this.url = stringUrl
    this.onmessage = () => {}
    this.terminate = () => {}
  }
  postMessage(msg: string): void {
    if (!onceIsEnough) {
      onceIsEnough = true
      this.onmessage(msg)
    }
  }
}
Object.defineProperty(window, 'Worker', {
  writable: true,
  value: Worker,
})

//
// test
describe('useFetchPolicies custom hook', () => {
  beforeEach(() => {
    onceIsEnough = false
  })

  test('Should parse discovered policy labels', async () => {
    const { result } = renderHook(() => useFetchPolicies(), { wrapper: RecoilRoot })
    expect(JSON.stringify(result.current.labelData)).toEqual(JSON.stringify(labelData))
  })
})

const items = [
  {
    id: 'policy-certificate-1CertificatePolicypolicy.open-cluster-management.io',
    apigroup: 'policy.open-cluster-management.io',
    name: 'policy-certificate-1',
    kind: 'CertificatePolicy',
    severity: 'low',
    responseAction: 'inform',
    policies: [
      {
        _isExternal: false,
        _uid: 'jes1/45fa130d-abff-4226-9cd8-fef1cf460080',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'jes1',
        compliant: 'Compliant',
        created: '2024-12-17T15:34:18Z',
        disabled: false,
        kind: 'CertificatePolicy',
        kind_plural: 'certificatepolicies',
        label:
          'cluster-name=jes1; cluster-namespace=jes1; governance=all; policy.open-cluster-management.io/cluster-name=jes1; policy.open-cluster-management.io/cluster-namespace=jes1; policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
        name: 'policy-certificate-1',
        namespace: 'jes1',
        remediationAction: 'inform',
        severity: 'low',
        source: {
          type: 'Policy',
          parentNs: 'open-cluster-management-global-set',
          parentName: 'policy-with-labels3',
        },
        responseAction: 'inform',
      },
      {
        _isExternal: false,
        _uid: 'jes2/54c2bc0f-0703-460a-8e98-d3ebf25cfb32',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'jes2',
        compliant: 'Compliant',
        created: '2024-12-17T15:34:18Z',
        disabled: false,
        kind: 'CertificatePolicy',
        kind_plural: 'certificatepolicies',
        label:
          'cluster-name=jes2; cluster-namespace=jes2; governance=all; policy.open-cluster-management.io/cluster-name=jes2; policy.open-cluster-management.io/cluster-namespace=jes2; policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
        name: 'policy-certificate-1',
        namespace: 'jes2',
        remediationAction: 'inform',
        severity: 'low',
        source: {
          type: 'Policy',
          parentNs: 'open-cluster-management-global-set',
          parentName: 'policy-with-labels3',
        },
        responseAction: 'inform',
      },
      {
        _hubClusterResource: true,
        _isExternal: false,
        _uid: 'local-cluster/4d1381b2-1d18-4982-8b63-cc5c99b7863f',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        compliant: 'Compliant',
        created: '2024-12-17T15:34:18Z',
        disabled: false,
        kind: 'CertificatePolicy',
        kind_plural: 'certificatepolicies',
        label:
          'cluster-name=local-cluster; cluster-namespace=local-cluster; governance=all; policy.open-cluster-management.io/cluster-name=local-cluster; policy.open-cluster-management.io/cluster-namespace=local-cluster; policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
        name: 'policy-certificate-1',
        namespace: 'local-cluster',
        remediationAction: 'inform',
        severity: 'low',
        source: {
          type: 'Policy',
          parentNs: 'open-cluster-management-global-set',
          parentName: 'policy-with-labels3',
        },
        responseAction: 'inform',
      },
    ],
    source: {
      type: 'Policy',
      parentNs: 'open-cluster-management-global-set',
      parentName: 'policy-with-labels3',
    },
  },
]

const labelData = {
  labelMap: {
    'policy-certificate-1CertificatePolicypolicy.open-cluster-management.io': {
      pairs: {
        governance: 'all',
      },
      labels: [
        'cluster-name=local-cluster',
        'cluster-namespace=local-cluster',
        'governance=all',
        'policy.open-cluster-management.io/cluster-name=local-cluster',
        'policy.open-cluster-management.io/cluster-namespace=local-cluster',
        'policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
      ],
    },
  },
  labelOptions: [
    {
      label: 'governance=all',
      value: 'governance=all',
    },
  ],
}

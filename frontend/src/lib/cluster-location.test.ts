/* Copyright Contributors to the Open Cluster Management project */
import { getClusterLocation } from './cluster-location'

describe('getClusterLocation', () => {
  it('reads region and zone and datacenter', () => {
    expect(getClusterLocation({ region: 'us-east-1', zone: 'us-east-1a', datacenter: 'dc1' })).toEqual({
      region: 'us-east-1',
      zone: 'us-east-1a',
      datacenter: 'dc1',
    })
  })

  it('falls back to topology.kubernetes.io labels', () => {
    expect(
      getClusterLocation({ 'topology.kubernetes.io/region': 'eu-west-1', 'topology.kubernetes.io/zone': 'eu-west-1b' })
    ).toEqual({ region: 'eu-west-1', zone: 'eu-west-1b' })
  })

  it('prefers region over topology region when both set', () => {
    expect(
      getClusterLocation({
        region: 'us-east-1',
        'topology.kubernetes.io/region': 'eu-west-1',
        zone: 'z1',
        'topology.kubernetes.io/zone': 'z2',
      })
    ).toEqual({ region: 'us-east-1', zone: 'z1' })
  })

  it('treats empty strings as unset', () => {
    expect(getClusterLocation({ region: '', zone: '', datacenter: '' })).toEqual({})
  })

  it('returns {} for undefined labels', () => {
    expect(getClusterLocation(undefined)).toEqual({})
  })
})

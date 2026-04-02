/* Copyright Contributors to the Open Cluster Management project */

import { createSecureContext } from 'node:tls'
import { getFips } from 'node:crypto'
import { ALL_ECDH_CURVES, FIPS_ECDH_CURVES, getEcdhCurves } from '../../src/lib/server'

describe('getEcdhCurves', () => {
  it('should include PQC curves when FIPS is disabled', () => {
    const result = getEcdhCurves(false)
    expect(result).toBe('X25519MLKEM768:X25519:P-256:P-384')
  })

  it('should only include NIST curves when FIPS is enabled', () => {
    const result = getEcdhCurves(true)
    expect(result).toBe('P-256:P-384')
  })

  it('should have FIPS curves as a subset of all curves', () => {
    for (const curve of FIPS_ECDH_CURVES) {
      expect(ALL_ECDH_CURVES).toContain(curve)
    }
  })

  it('should produce a valid ecdhCurve string for FIPS mode', () => {
    const curves = getEcdhCurves(true)
    expect(() => createSecureContext({ ecdhCurve: curves })).not.toThrow()
  })

  it('should produce a valid ecdhCurve string for non-FIPS mode', () => {
    const curves = getEcdhCurves(false)
    if (getFips()) {
      // On a FIPS runner, PQC curves will be rejected -- skip validation
      return
    }
    expect(() => createSecureContext({ ecdhCurve: curves })).not.toThrow()
  })
})

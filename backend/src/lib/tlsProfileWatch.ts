/* Copyright Contributors to the Open Cluster Management project */

import { KubeConfig, Watch } from '@kubernetes/client-node'
import { getCiphers, SecureContextOptions, SecureVersion } from 'node:tls'
import { logger } from './logger'

type TLSProfileType = 'Old' | 'Intermediate' | 'Modern' | 'Custom'
type TLSVersionValue = 'VersionTLS10' | 'VersionTLS11' | 'VersionTLS12' | 'VersionTLS13'

const TLS_VERSION_MAP: Record<TLSVersionValue, SecureVersion> = {
  VersionTLS10: 'TLSv1',
  VersionTLS11: 'TLSv1.1',
  VersionTLS12: 'TLSv1.2',
  VersionTLS13: 'TLSv1.3',
}

type TLSProfileSpec = {
  minTLSVersion?: TLSVersionValue
  ciphers?: string[]
}

type TLSSecurityProfile = {
  type?: TLSProfileType
  custom?: TLSProfileSpec
  old?: Record<string, never>
  intermediate?: Record<string, never>
  modern?: Record<string, never>
}

type APIServerSpec = {
  tlsSecurityProfile?: TLSSecurityProfile
}

type APIServer = {
  apiVersion: 'config.openshift.io/v1'
  kind: 'APIServer'
  metadata?: {
    name: string
  }
  spec: APIServerSpec
}

/**
 * Built-in TLS security profiles for OpenShift API servers.
 * List of ciphers and minimum TLS version for each built-inprofile can be obtained from the following command:
 * ```
 * oc explain apiserver.spec.tlsSecurityProfile.<lowercase-profile-name>
 * ```
 */
const BUILTIN_SPECS: Record<string, { minTLSVersion: TLSVersionValue; ciphers: string[] }> = {
  Old: {
    minTLSVersion: 'VersionTLS10',
    ciphers: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'DHE-RSA-AES128-GCM-SHA256',
      'DHE-RSA-AES256-GCM-SHA384',
      'DHE-RSA-CHACHA20-POLY1305',
      'ECDHE-ECDSA-AES128-SHA256',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-ECDSA-AES128-SHA',
      'ECDHE-RSA-AES128-SHA',
      'ECDHE-ECDSA-AES256-SHA384',
      'ECDHE-RSA-AES256-SHA384',
      'ECDHE-ECDSA-AES256-SHA',
      'ECDHE-RSA-AES256-SHA',
      'DHE-RSA-AES128-SHA256',
      'DHE-RSA-AES256-SHA256',
      'AES128-GCM-SHA256',
      'AES256-GCM-SHA384',
      'AES128-SHA256',
      'AES256-SHA256',
      'AES128-SHA',
      'AES256-SHA',
      'DES-CBC3-SHA',
    ],
  },
  Intermediate: {
    minTLSVersion: 'VersionTLS12',
    ciphers: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'DHE-RSA-AES128-GCM-SHA256',
      'DHE-RSA-AES256-GCM-SHA384',
    ],
  },
  Modern: {
    minTLSVersion: 'VersionTLS13',
    ciphers: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'],
  },
}

function toNodeTLSOptions(spec?: TLSSecurityProfile): SecureContextOptions {
  const securityProfileSpec =
    spec?.type === 'Custom' && spec.custom ? spec.custom : BUILTIN_SPECS[spec?.type ?? 'Intermediate']
  const minVersion = TLS_VERSION_MAP[securityProfileSpec.minTLSVersion ?? 'VersionTLS12']
  const supportedCiphers = getCiphers()
  // If the profile is custom and the minimum TLS version is TLSv1.3, custom ciphers are currently not allowed
  // Use the modern ciphers if none are set.
  const defaultCiphers = spec?.type === 'Custom' && minVersion === 'TLSv1.3' ? BUILTIN_SPECS['Modern'].ciphers : []
  const potentialCiphers = securityProfileSpec.ciphers?.length > 0 ? securityProfileSpec.ciphers : defaultCiphers
  const ciphers = potentialCiphers?.filter((c) => supportedCiphers.includes(c.toLowerCase())).join(':')
  return { minVersion, ciphers }
}

export function watchTLSSecurityProfile(onProfileChange: (opts: SecureContextOptions) => void): () => void {
  const kc = new KubeConfig()
  kc.loadFromDefault()
  const watch = new Watch(kc)
  const path = '/apis/config.openshift.io/v1/apiservers'
  const req = watch.watch(
    path,
    { fieldSelector: 'metadata.name=cluster' },
    (_type: string, obj: APIServer) => {
      if (obj?.spec) {
        onProfileChange(toNodeTLSOptions(obj.spec?.tlsSecurityProfile))
      }
    },
    (err: unknown) => {
      if (err) logger.error({ msg: 'TLS profile watch error', error: err instanceof Error ? err.message : err })
    }
  )
  return () => void req.then((ac) => ac.abort())
}

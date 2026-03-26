/* Copyright Contributors to the Open Cluster Management project */

import got, { HTTPError, TimeoutError } from 'got'
import { getCiphers, SecureContextOptions, SecureVersion } from 'node:tls'
import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream'
import { logger } from './logger'
import { getCACertificate, getServiceAccountToken } from './serviceAccountToken'

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
    resourceVersion?: string
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
    spec?.type === 'Custom' && spec.custom
      ? spec.custom
      : (BUILTIN_SPECS[spec?.type ?? 'Intermediate'] ?? BUILTIN_SPECS['Intermediate'])
  const minVersion = TLS_VERSION_MAP[securityProfileSpec.minTLSVersion ?? 'VersionTLS12']
  const supportedCiphers = getCiphers()
  // If the profile is custom and the minimum TLS version is TLSv1.3, custom ciphers are currently not allowed
  // Use the modern ciphers if none are set.
  const defaultCiphers = spec?.type === 'Custom' && minVersion === 'TLSv1.3' ? BUILTIN_SPECS['Modern'].ciphers : []
  const potentialCiphers = securityProfileSpec.ciphers?.length > 0 ? securityProfileSpec.ciphers : defaultCiphers
  const ciphers = potentialCiphers?.filter((c) => supportedCiphers.includes(c.toLowerCase())).join(':')
  return { minVersion, ciphers }
}

const API_PATH = '/apis/config.openshift.io/v1/apiservers'
const FIELD_SELECTOR = 'fieldSelector=metadata.name=cluster'

let stoppingTLSProfileWatch = false
let currentTLSOptions: SecureContextOptions | undefined
let activeRequest: { destroy: () => void } | undefined

export function watchTLSSecurityProfile(onProfileChange: (opts: SecureContextOptions) => Promise<void>): () => void {
  stoppingTLSProfileWatch = false
  currentTLSOptions = undefined
  void listAndWatchTLSProfile(onProfileChange)
  return () => {
    stoppingTLSProfileWatch = true
    activeRequest?.destroy()
  }
}

async function listAndWatchTLSProfile(onProfileChange: (opts: SecureContextOptions) => Promise<void>): Promise<void> {
  while (!stoppingTLSProfileWatch) {
    try {
      const serviceAccountToken = getServiceAccountToken()
      const { resourceVersion } = await listTLSProfile(serviceAccountToken, onProfileChange)
      await watchTLSProfileStream(serviceAccountToken, resourceVersion, onProfileChange)
    } catch (err: unknown) {
      if (stoppingTLSProfileWatch) break
      await handleWatchError(err)
    }
  }
}

async function handleWatchError(err: unknown): Promise<void> {
  if (err instanceof SyntaxError) {
    // Non-JSON response (e.g. stale resource version) — retry immediately
  } else if (err instanceof HTTPError) {
    switch (err.response.statusCode) {
      case 403:
        logger.error({ msg: 'TLS profile watch', status: 'Forbidden' })
        break
      case 404:
        logger.trace({ msg: 'TLS profile watch', status: 'Not found' })
        break
      default:
        logger.error({ msg: 'TLS profile watch error', error: err.message })
    }
    await new Promise((resolve) => setTimeout(resolve, 60_000 + Math.ceil(Math.random() * 10_000)).unref())
  } else if (err instanceof Error) {
    if (err.message === 'Premature close' || err.message.startsWith('too old resource version')) {
      // Retry list and watch immediately
    } else {
      logger.error({ msg: 'TLS profile watch error', error: err.message })
      await new Promise((resolve) => setTimeout(resolve, 60_000 + Math.ceil(Math.random() * 10_000)).unref())
    }
  } else {
    logger.error({ msg: 'TLS profile watch error', error: JSON.stringify(err) })
    await new Promise((resolve) => setTimeout(resolve, 60_000 + Math.ceil(Math.random() * 10_000)).unref())
  }
}

async function listTLSProfile(
  serviceAccountToken: string,
  onProfileChange: (opts: SecureContextOptions) => Promise<void>
): Promise<{ resourceVersion: string }> {
  const url = `${process.env.CLUSTER_API_URL}${API_PATH}?${FIELD_SELECTOR}`
  const response = await got
    .get(url, {
      headers: { authorization: `Bearer ${serviceAccountToken}` },
      https: { certificateAuthority: getCACertificate() },
    })
    .json<{
      metadata: { resourceVersion: string }
      items: APIServer[]
    }>()

  if (response.items?.length > 0) {
    const opts = toNodeTLSOptions(response.items[0].spec?.tlsSecurityProfile)
    await applyIfChanged(opts, onProfileChange)
  }

  return { resourceVersion: response.metadata.resourceVersion }
}

async function watchTLSProfileStream(
  serviceAccountToken: string,
  initialResourceVersion: string,
  onProfileChange: (opts: SecureContextOptions) => Promise<void>
): Promise<void> {
  const resourceVersionRef = { value: initialResourceVersion }

  while (!stoppingTLSProfileWatch) {
    const url =
      `${process.env.CLUSTER_API_URL}${API_PATH}` +
      `?watch&allowWatchBookmarks&${FIELD_SELECTOR}&resourceVersion=${resourceVersionRef.value}`
    const request = got.stream(url, {
      headers: { authorization: `Bearer ${serviceAccountToken}` },
      https: { certificateAuthority: getCACertificate() },
      timeout: { socket: 5 * 60 * 1000 + Math.ceil(Math.random() * 10 * 1000) },
    })
    activeRequest = request
    try {
      await pipeline(request, createSplitStream(), createTLSWatchProcessor(resourceVersionRef, onProfileChange))
    } catch (err: unknown) {
      if (err instanceof TimeoutError) {
        // Socket timeout — retry the watch
      } else if (err instanceof HTTPError) {
        throw err
      } else if ((err as Error)?.message === 'Premature close') {
        // Stream destroyed or connection lost — retry the watch
      } else {
        throw err
      }
    } finally {
      if (activeRequest === request) activeRequest = undefined
    }
  }
}

function createSplitStream(): Transform {
  let buffer = ''
  return new Transform({
    objectMode: true,
    transform(chunk: Buffer, _encoding, callback) {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) {
          this.push(line)
        }
      }
      callback()
    },
    flush(callback) {
      if (buffer.trim()) {
        this.push(buffer)
      }
      callback()
    },
  })
}

function createTLSWatchProcessor(
  resourceVersionRef: { value: string },
  onProfileChange: (opts: SecureContextOptions) => Promise<void>
): Transform {
  return new Transform({
    objectMode: true,
    async transform(data: string, _encoding, callback): Promise<void> {
      try {
        const event = JSON.parse(data) as {
          type: string
          object: APIServer & { message?: string }
        }

        const resourceVersion = event.object?.metadata?.resourceVersion
        if (resourceVersion) {
          resourceVersionRef.value = resourceVersion
        }

        switch (event.type) {
          case 'ADDED':
          case 'MODIFIED':
            if (event.object?.spec) {
              await applyIfChanged(toNodeTLSOptions(event.object.spec.tlsSecurityProfile), onProfileChange)
            }
            break
          case 'BOOKMARK':
            break
          case 'ERROR':
            logger.warn({ msg: 'TLS profile watch error event', message: event.object?.message })
            throw new Error(event.object?.message ?? 'Unknown watch error')
        }

        callback()
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(JSON.stringify(err))
        callback(error)
      }
    },
  })
}

async function applyIfChanged(
  opts: SecureContextOptions,
  onProfileChange: (opts: SecureContextOptions) => Promise<void>
): Promise<void> {
  if (currentTLSOptions?.minVersion === opts.minVersion && currentTLSOptions?.ciphers === opts.ciphers) {
    logger.debug({ msg: 'TLS security profile unchanged', minVersion: opts.minVersion })
    return
  }
  logger.info({ msg: 'TLS security profile changed', minVersion: opts.minVersion })
  currentTLSOptions = opts
  await onProfileChange(opts)
}

/* Copyright Contributors to the Open Cluster Management project */

import got, { HTTPError, TimeoutError } from 'got'
import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream'
import { logger } from './logger'
import { getCACertificate, getServiceAccountToken } from './serviceAccountToken'

const HUB_NAMESPACE = 'open-cluster-management-hub'
const CONFIGMAP_NAME = 'ca-bundle-configmap'
const CA_BUNDLE_KEY = 'ca-bundle.crt'
const API_PATH = `/api/v1/namespaces/${HUB_NAMESPACE}/configmaps`
const FIELD_SELECTOR = `fieldSelector=metadata.name=${CONFIGMAP_NAME}`

type ConfigMap = {
  metadata?: { name?: string; resourceVersion?: string }
  data?: Record<string, string>
}

let stopping = false
let currentCA: string | undefined
let activeRequest: { destroy: () => void } | undefined

export function getPlacementDebugCA(): string | undefined {
  return currentCA
}

export function watchPlacementDebugCA(onCAChange: () => void): () => void {
  stopping = false
  currentCA = undefined
  void listAndWatchPlacementDebugCA(onCAChange)
  return () => {
    stopping = true
    activeRequest?.destroy()
  }
}

async function listAndWatchPlacementDebugCA(onCAChange: () => void): Promise<void> {
  while (!stopping) {
    try {
      const serviceAccountToken = getServiceAccountToken()
      const { resourceVersion } = await listPlacementDebugCA(serviceAccountToken, onCAChange)
      await watchPlacementDebugCAStream(serviceAccountToken, resourceVersion, onCAChange)
    } catch (err: unknown) {
      if (stopping) break
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
        logger.error({ msg: 'placement debug CA watch', status: 'Forbidden' })
        break
      case 404:
        logger.trace({ msg: 'placement debug CA watch', status: 'Not found' })
        break
      default:
        logger.error({ msg: 'placement debug CA watch error', error: err.message })
    }
    await new Promise((resolve) => setTimeout(resolve, 60_000 + Math.ceil(Math.random() * 10_000)).unref())
  } else if (err instanceof Error) {
    if (err.message === 'Premature close' || err.message.startsWith('too old resource version')) {
      // Retry list and watch immediately
    } else {
      logger.error({ msg: 'placement debug CA watch error', error: err.message })
      await new Promise((resolve) => setTimeout(resolve, 60_000 + Math.ceil(Math.random() * 10_000)).unref())
    }
  } else {
    logger.error({ msg: 'placement debug CA watch error', error: JSON.stringify(err) })
    await new Promise((resolve) => setTimeout(resolve, 60_000 + Math.ceil(Math.random() * 10_000)).unref())
  }
}

async function listPlacementDebugCA(
  serviceAccountToken: string,
  onCAChange: () => void
): Promise<{ resourceVersion: string }> {
  const url = `${process.env.CLUSTER_API_URL}${API_PATH}?${FIELD_SELECTOR}`
  const response = await got
    .get(url, {
      headers: { authorization: `Bearer ${serviceAccountToken}` },
      https: { certificateAuthority: getCACertificate() },
    })
    .json<{
      metadata: { resourceVersion: string }
      items: ConfigMap[]
    }>()

  const ca = response.items?.[0]?.data?.[CA_BUNDLE_KEY]
  if (ca) {
    applyIfChanged(ca, onCAChange)
  } else if (currentCA !== undefined) {
    logger.info({ msg: 'placement debug CA bundle removed' })
    currentCA = undefined
    onCAChange()
  }

  return { resourceVersion: response.metadata.resourceVersion }
}

async function watchPlacementDebugCAStream(
  serviceAccountToken: string,
  initialResourceVersion: string,
  onCAChange: () => void
): Promise<void> {
  const resourceVersionRef = { value: initialResourceVersion }

  while (!stopping) {
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
      await pipeline(request, createSplitStream(), createCAWatchProcessor(resourceVersionRef, onCAChange))
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

function createCAWatchProcessor(resourceVersionRef: { value: string }, onCAChange: () => void): Transform {
  return new Transform({
    objectMode: true,
    transform(data: string, _encoding, callback): void {
      try {
        const event = JSON.parse(data) as {
          type: string
          object: ConfigMap & { message?: string }
        }

        const resourceVersion = event.object?.metadata?.resourceVersion
        if (resourceVersion) {
          resourceVersionRef.value = resourceVersion
        }

        switch (event.type) {
          case 'ADDED':
          case 'MODIFIED':
            applyIfChanged(event.object?.data?.[CA_BUNDLE_KEY], onCAChange)
            break
          case 'DELETED':
            if (currentCA !== undefined) {
              logger.info({ msg: 'placement debug CA bundle removed' })
              currentCA = undefined
              onCAChange()
            }
            break
          case 'BOOKMARK':
            break
          case 'ERROR':
            logger.warn({ msg: 'placement debug CA watch error event', message: event.object?.message })
            callback(new Error(event.object?.message ?? 'Unknown watch error'))
            return
        }

        callback()
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(JSON.stringify(err))
        callback(error)
      }
    },
  })
}

function applyIfChanged(ca: string | undefined, onCAChange: () => void): void {
  if (!ca) return
  if (currentCA === ca) {
    logger.debug({ msg: 'placement debug CA bundle unchanged' })
    return
  }
  logger.info({ msg: 'placement debug CA bundle updated' })
  currentCA = ca
  onCAChange()
}

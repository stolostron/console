/* Copyright Contributors to the Open Cluster Management project */
import type { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream'
import {
  createBrotliCompress,
  createBrotliDecompress,
  createDeflate,
  createGunzip,
  createGzip,
  createInflate,
  inflateRaw,
  deflateRaw,
  type Zlib,
} from 'node:zlib'
import { logger } from './logger'
import type { ServerSideEvent, WatchEvent } from './server-side-events'
import { getEventDict } from '../routes/events'
import { getAppDict, type ICompressedResource, type ITransformedResource } from '../routes/aggregators/applications'
import { promisify } from 'node:util'
import type { IResource } from './../resources/resource'

const MAX_RECENTLY_ADDED = 200

type Dictionary = {
  arr: string[]
  map: Record<string, string>
  add: (key: string) => string
  get: (inx: number) => string
  recentlyAdded: string[]
  snapshotSize: () => number
  drainRecentlyAdded: () => string[]
}

export function createDictionary(): Dictionary {
  const arr: string[] = []
  const map: Record<string, string> = {}
  const recentlyAdded: string[] = []
  const add = (key: string): string => {
    if (!(key in map)) {
      map[key] = `${arr.length}`
      arr.push(key)
      if (logger.isLevelEnabled('debug') && recentlyAdded.length < MAX_RECENTLY_ADDED) {
        recentlyAdded.push(key)
      }
    }
    return map[key]
  }
  const get = (inx: number) => {
    return arr[inx]
  }
  const snapshotSize = () => arr.length
  const drainRecentlyAdded = () => recentlyAdded.splice(0)
  return {
    arr,
    map,
    add,
    get,
    recentlyAdded,
    snapshotSize,
    drainRecentlyAdded,
  }
}

// keys that point to unique values (don't index)
const valueAsIsKeys = new Set(['uid', 'name', 'resourceVersion', 'generation'])
// keys that point to values that are likely to be repeated (we should index)
const valueInDictionaryKeys = new Set([
  'apiVersion',
  'kind',
  'namespace',
  'pathname',
  'group',
  'webConsoleURL',
  'ocpClusterId',
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UncompressedResourceType = Record<string, any> | Record<string, any[]> | string | number

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CompressedResourceType = Record<number, any> | Record<number, any[]> | string | number

const NUMBER_MARKER = '#!%'

// Detects ISO 8601 timestamps to avoid permanently indexing unique time values.
// Covers: "2026-05-27T20:18:12Z" (20), "2026-05-27T20:18:12.000Z" (24), "2026-05-27T20:18:12+05:30" (25)
export function isTimestamp(s: string): boolean {
  return (
    (s.length === 20 || s.length === 24 || s.length === 25) &&
    s[4] === '-' &&
    s[7] === '-' &&
    s[10] === 'T' &&
    s[13] === ':' &&
    (s.endsWith('Z') || s[19] === '+' || s[19] === '-')
  )
}

export async function deflateResource(resource: IResource, dictionary: Dictionary): Promise<Buffer> {
  const res = compressResource(resource as UncompressedResourceType, dictionary)
  let buffer
  try {
    buffer = await promisify(deflateRaw)(JSON.stringify(res))
  } catch (err: unknown) {
    logger.error({
      msg: 'Error from deflateRaw during deflateResource',
      error: err instanceof Error ? err.message : err,
    })
    throw err
  }
  return buffer
}

function compressResource(resource: UncompressedResourceType, dictionary: Dictionary): CompressedResourceType {
  if (resource) {
    if (Array.isArray(resource)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      return resource.map((item: UncompressedResourceType) => compressResource(item, dictionary))
    } else if (typeof resource === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: Record<string, any> = {}
      for (const key in resource) {
        if (Object.prototype.hasOwnProperty.call(resource, key)) {
          // filter out these key/values
          // dont try to index the values pointed to by key
          if (
            valueAsIsKeys.has(key) ||
            (key === 'message' &&
              'message' in resource &&
              typeof resource[key] === 'string' &&
              resource[key].length > 32) ||
            key.includes('Time')
          ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            res[dictionary.add(key)] = resource[key]
          } else {
            const inx = dictionary.add(key)
            if (valueInDictionaryKeys.has(key)) {
              res[inx] = dictionary.add(resource[key] as string)
            } else {
              res[inx] = compressResource(resource[key] as UncompressedResourceType, dictionary)
            }
          }
        }
      }
      return res
    } else if (typeof resource === 'string') {
      if (resource.length < 32 && !resource.endsWith('==')) {
        // skip indexing of all timestamps
        if (isTimestamp(resource)) {
          return resource
        }
        // index short strings that aren't a base64
        return dictionary.add(resource)
      }
    } else if (typeof resource === 'number' && Number.isInteger(resource)) {
      // to differentiate between an index and a value that is actually a number
      return `${NUMBER_MARKER}${resource}`
    }
  }
  return resource
}

export async function inflateResource(buffer: Buffer, dictionary: Dictionary): Promise<IResource> {
  let inflated
  try {
    inflated = (await promisify(inflateRaw)(buffer)).toString()
  } catch (err: unknown) {
    logger.error({
      msg: 'Error from inflateRaw during inflateResource',
      error: err instanceof Error ? err.message : err,
    })
    throw err
  }
  const res = JSON.parse(inflated) as CompressedResourceType
  return decompressResource(res, dictionary) as IResource
}

export async function inflateEvent(event: ServerSideEvent): Promise<ServerSideEvent> {
  const { id, data } = event
  const { type, object } = data as WatchEvent
  return !object
    ? event
    : { id, data: { type, object: Buffer.isBuffer(object) ? await inflateResource(object, getEventDict()) : object } }
}

export async function inflateApps(apps: ICompressedResource[]): Promise<ITransformedResource[]> {
  return await Promise.all(apps.map(async (app) => await inflateApp(app)))
}

export async function inflateApp(app: ITransformedResource | ICompressedResource): Promise<ITransformedResource> {
  const capp = app as ICompressedResource
  if (capp.compressed) {
    return {
      ...(await inflateResource(capp.compressed, getAppDict())),
      transform: capp.transform,
      remoteClusters: capp.remoteClusters,
    }
  }
  return app as ITransformedResource
}

function decompressResource(resource: CompressedResourceType, dictionary: Dictionary): UncompressedResourceType {
  if (typeof resource === 'boolean') {
    return resource
  } else if (resource) {
    if (Array.isArray(resource)) {
      return resource.map((item: CompressedResourceType) => decompressResource(item, dictionary))
    } else if (typeof resource === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: Record<string, any> = {}
      for (const inx in resource) {
        if (Object.prototype.hasOwnProperty.call(resource, inx)) {
          const key = dictionary.get(Number(inx))
          if (
            valueAsIsKeys.has(key) ||
            (key === 'message' && inx in resource && !Number.isInteger(Number(resource[inx]))) ||
            key.includes('Time')
          ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            res[key] = resource[inx]
          } else {
            if (valueInDictionaryKeys.has(key)) {
              res[key] = dictionary.get(resource[inx] as number)
            } else {
              res[key] = decompressResource(resource[inx] as CompressedResourceType, dictionary)
            }
          }
        }
      }
      return res
    } else if (Number.isInteger(Number(resource))) {
      return dictionary.get(Number(resource))
    } else if (typeof resource === 'string' && resource.startsWith(NUMBER_MARKER)) {
      return Number(resource.substring(NUMBER_MARKER.length))
    }
  }
  return resource
}

export function getDecodeStream(stream: Readable, contentEncoding?: string | string[]): Readable {
  switch (contentEncoding) {
    case undefined:
    case 'identity':
      return stream
    case 'deflate':
      return pipeline(stream, createDeflate(), (err) => {
        if (err) logger.warn(err)
      })
    case 'br':
      return pipeline(stream, createBrotliDecompress(), (err) => {
        if (err) logger.warn(err)
      })
    case 'gzip':
      return pipeline(stream, createGunzip(), (err) => {
        if (err) logger.warn(err)
      })
    default:
      throw new Error('Unknown content encoding')
  }
}

export function getEncodeStream(
  stream: NodeJS.WritableStream,
  acceptEncoding?: string | string[],
  disabled = false
): [NodeJS.WritableStream, (Transform & Zlib) | undefined, string] {
  let encoding = 'identity'

  if (!disabled) {
    // Firefox tells us it supports 'br' but it does not... disabling
    // if (acceptEncoding?.includes('br')) encoding = 'br' else
    if (acceptEncoding?.includes('gzip')) encoding = 'gzip'
    else if (acceptEncoding?.includes('deflate')) encoding = 'deflate'
  }

  let compressionStream: (Transform & Zlib) | undefined
  switch (encoding) {
    case 'br':
      compressionStream = createBrotliCompress()
      break
    case 'gzip':
      compressionStream = createGzip()
      break
    case 'deflate':
      compressionStream = createInflate()
      break
  }

  if (compressionStream) {
    pipeline(compressionStream, stream, (_err) => {
      // Client might close stream while we are still writing to it
      // ignore it for now as there is no issue here
      // TODO - long term should we close the compression stream
      // when client request ends?
      // if (err) logger.warn(err)
    })
  }
  return [stream, compressionStream, encoding]
}

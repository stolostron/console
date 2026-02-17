/* Copyright Contributors to the Open Cluster Management project */

import { readFileSync } from 'fs'
import { join } from 'node:path'
import { rootCertificates } from 'tls'
import { logger } from './logger'
import { watchFile } from './fileWatch'

const SERVICE_ACCOUNT_BASE_PATH = '/var/run/secrets/kubernetes.io/serviceaccount'

function getServiceAccountFilePath(name: string): string {
  return join(SERVICE_ACCOUNT_BASE_PATH, name)
}

/**
 * Reads a service account file and sets up a watch; when the file changes,
 * onChange is called. By default the watch expires after the first change (persist: false).
 */
export function watchServiceAccountFile(
  name: string,
  defaultValue: string,
  exitOnError?: boolean,
  onChange?: () => void
): string {
  const filePath = getServiceAccountFilePath(name)
  if (onChange && process.env.NODE_ENV !== 'development') {
    watchFile(filePath, onChange)
  }
  return readFileOrUseDefault(filePath, defaultValue, exitOnError)
}

function readFileOrUseDefault(filePath: string, defaultValue: string, exitOnError?: boolean): string {
  let value: string
  try {
    value = readFileSync(filePath, 'utf-8')
  } catch (err: unknown) {
    value = defaultValue
    /* istanbul ignore if */
    if (!value) {
      const msg = `Error reading file ${filePath}`
      if (err instanceof Error) {
        logger.error(msg, err?.message)
      } else {
        logger.error({ msg, err })
      }
      if (exitOnError) {
        process.exit(1)
      }
    }
  }
  return value
}

let serviceAccountToken: string
export function getServiceAccountToken(): string {
  if (serviceAccountToken === undefined) {
    serviceAccountToken = watchServiceAccountFile('token', process.env.TOKEN, true, () => {
      serviceAccountToken = undefined
    })
  }
  return serviceAccountToken
}

let namespace: string
export function getNamespace(): string {
  if (namespace === undefined) {
    const potentialNamespace = watchServiceAccountFile('namespace', process.env.SEARCH_API_URL, undefined, () => {
      namespace = undefined
    })
    if (potentialNamespace !== process.env.SEARCH_API_URL) {
      namespace = potentialNamespace
    }
  }
  return namespace
}

function base64DecodeValue(value: string): string {
  return value ? Buffer.from(value, 'base64').toString('ascii') : undefined
}

type Certificates = string | string[]

function getCertificate(
  name: string,
  base64DefaultValue: string,
  includeRoot?: boolean,
  onChange?: () => void
): Certificates {
  const internal_cert = watchServiceAccountFile(name, base64DecodeValue(base64DefaultValue), undefined, onChange)
  return [internal_cert, ...(includeRoot ? rootCertificates : [])] // include root certificates in addition to internal cluster certificates
}

let ca_cert: Certificates
export function getCACertificate(onChange?: () => void): Certificates {
  if (ca_cert === undefined) {
    ca_cert = getCertificate('ca.crt', process.env.CA_CERT, true, () => {
      ca_cert = undefined
      onChange?.()
    })
  }
  return ca_cert
}

let service_ca_cert: Certificates
export function getServiceCACertificate(onChange?: () => void): Certificates {
  if (service_ca_cert === undefined) {
    // in dev mode, connections to Services need to be proxied via Routes, so they need root certificates
    service_ca_cert = getCertificate(
      'service-ca.crt',
      process.env.SERVICE_CA_CERT,
      process.env.NODE_ENV !== 'production',
      () => {
        service_ca_cert = undefined
        onChange?.()
      }
    )
  }
  return service_ca_cert
}

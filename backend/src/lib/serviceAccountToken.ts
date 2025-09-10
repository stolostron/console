/* Copyright Contributors to the Open Cluster Management project */

import { readFileSync } from 'fs'
import { rootCertificates } from 'tls'
import { logger } from './logger'

function readServiceAccountFile(name: string, defaultValue: string, exitOnError?: boolean): string {
  let serviceAccountValue: string
  try {
    serviceAccountValue = readFileSync(`/var/run/secrets/kubernetes.io/serviceaccount/${name}`, 'utf-8')
  } catch (err: unknown) {
    serviceAccountValue = defaultValue
    /* istanbul ignore if */
    if (!serviceAccountValue) {
      const msg = `Error reading service account ${name}`
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
  return serviceAccountValue
}

let serviceAccountToken: string
export function getServiceAccountToken(): string {
  if (serviceAccountToken === undefined) {
    serviceAccountToken = readServiceAccountFile('token', process.env.TOKEN, true)
  }
  return serviceAccountToken
}

let namespace: string
export function getNamespace(): string {
  if (namespace === undefined) {
    const potentialNamespace = readServiceAccountFile('namespace', process.env.SEARCH_API_URL)
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

function getCertificate(name: string, base64DefaultValue: string, includeRoot?: boolean): Certificates {
  const internal_cert = readServiceAccountFile(name, base64DecodeValue(base64DefaultValue))
  return [internal_cert, ...(includeRoot ? rootCertificates : [])] // include root certificates in addition to internal cluster certificates
}

let ca_cert: Certificates
export function getCACertificate(): Certificates {
  if (ca_cert === undefined) {
    ca_cert = getCertificate('ca.crt', process.env.CA_CERT, true)
  }
  return ca_cert
}

let service_ca_cert: Certificates
export function getServiceCACertificate(): Certificates {
  if (service_ca_cert === undefined) {
    // in dev mode, connections to Services need to be proxied via Routes, so they need root certificates
    service_ca_cert = getCertificate(
      'service-ca.crt',
      process.env.SERVICE_CA_CERT,
      process.env.NODE_ENV !== 'production'
    )
  }
  return service_ca_cert
}

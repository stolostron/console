/* Copyright Contributors to the Open Cluster Management project */
import { RequestOptions } from 'node:https'

/**
 * Remove trailing dot from hostname for SNI compatibility
 * @param hostname - The hostname that may have a trailing dot
 * @returns The hostname without trailing dot
 */
export function normalizeHostname(hostname: string): string {
  return hostname.endsWith('.') ? hostname.slice(0, -1) : hostname
}

/**
 * Get request options from a URL
 * @param url - The URL to get the protocol, hostname, servername, port, and path from
 * @param options - additional options to include
 * @returns The request options
 */
export function getRequestOptionsFromURL(url: URL, options?: Partial<RequestOptions>): RequestOptions {
  return {
    ...(options ?? {}),
    protocol: url.protocol,
    hostname: url.hostname,
    servername: normalizeHostname(url.hostname),
    port: url.port,
    path: url.pathname,
  }
}

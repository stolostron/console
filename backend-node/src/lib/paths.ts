/* Copyright Contributors to the Open Cluster Management project */
import { join } from 'node:path'

export function envFilePath(): string {
  return process.env.ENV_FILE || '.env'
}

export function configDir(): string {
  return process.env.CONFIG_DIR || './config'
}

export function certsDir(): string {
  return process.env.CERTS_DIR || './certs'
}

export function certFile(name: string): string {
  return join(certsDir(), name)
}

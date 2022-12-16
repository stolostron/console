/* Copyright Contributors to the Open Cluster Management project */

import { readFileSync } from 'fs'
import { logger } from '../lib/logger'

export let serviceAccountToken: string

export function getServiceAccountToken(): string {
    if (serviceAccountToken === undefined) {
        try {
            serviceAccountToken = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf-8')
        } catch (err: unknown) {
            serviceAccountToken = process.env.TOKEN
            if (!serviceAccountToken) {
                if (err instanceof Error) {
                    logger.error('Error reading service account token', err && err.message)
                } else {
                    logger.error({ msg: 'Error reading service account token', err: err })
                }
                process.exit(1)
            }
        }
    }
    return serviceAccountToken
}

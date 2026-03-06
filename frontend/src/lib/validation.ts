/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'react-i18next'
import validator from 'validator'
import isCidr from 'is-cidr'

export const VALID_DNS_NAME_TESTER = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/

const FQDN_OPTIONS = { require_tld: false }

export function validateHttpsURL(value: string, t: TFunction) {
  if (value) {
    if (
      validator.isURL(value, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['https'],
        require_host: true,
      })
    ) {
      return undefined
    }
    return t('validate.https.url.not.valid')
  }
  return undefined
}

export function validateNoProxy(value: string, t: TFunction) {
  if (
    validator.isFQDN(value, FQDN_OPTIONS) ||
    (value.startsWith('.') && validator.isFQDN(value.substring(1), FQDN_OPTIONS)) ||
    validator.isIP(value) ||
    isCidr(value) ||
    value === '*'
  ) {
    return undefined
  }

  return t(
    "Each value must be a domain name (optionally prefaced with '.' to match subdomains only), IP address, other network CIDR, or '*'."
  )
}

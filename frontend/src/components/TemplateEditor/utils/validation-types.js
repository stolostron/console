'use strict'

import get from 'lodash/get'
import IPCIDR from 'ip-cidr'
import { Address4, Address6 } from 'ip-address'

const IP_ADDRESS_TESTER = {
  test: (value) => new Address4(value).isValid() || new Address6(value).isValid(),
}

const getCIDRContextTexter = (cidrFieldKey, sourcePath) => {
  const { tabId, path } = sourcePath
  return (value, templateObjectMap, i18n) => {
    if (!IP_ADDRESS_TESTER.test(value)) {
      return i18n('creation.ocp.cluster.valid.ip')
    }
    const cidrString = get(templateObjectMap[tabId], path) || ''
    const cidr = new IPCIDR(cidrString.toString())
    if (cidr.isValid() && !cidr.contains(value)) {
      const cidrFieldName = i18n(cidrFieldKey)
      return i18n('creation.ocp.cluster.valid.cidr.membership', [cidrFieldName, cidrString])
    }
    return null
  }
}

const MACHINE_CIDR_CONTEXT_TESTER = getCIDRContextTexter('creation.ocp.machine.cidr', {
  tabId: 'install-config',
  path: 'unknown[0].$synced.networking.$v.machineCIDR.$v',
})

export const VALIDATE_IP = {
  tester: IP_ADDRESS_TESTER,
  notification: 'creation.ocp.cluster.valid.ip',
  required: true,
}

export const VALIDATE_IP_OPTIONAL = {
  tester: IP_ADDRESS_TESTER,
  notification: 'creation.ocp.cluster.valid.ip',
  required: false,
}

export const VALIDATE_CIDR = {
  tester: {
    test: (value) => {
      const cidr = new IPCIDR(value)
      // Ensure CIDR is valid and results in more than one address
      return cidr.isValid() && cidr.start() !== cidr.end()
    },
  },
  notification: 'creation.ocp.cluster.valid.cidr',
  required: true,
}

export const VALIDATE_URL = {
  tester: {
    test: (value) => {
      try {
        new URL(value)
      } catch (e) {
        return false
      }
      return true
    },
  },
  notification: 'creation.invalid.url',
  required: true,
}

export const VALIDATE_URL_OPTIONAL = {
  tester: {
    test: (value) => {
      try {
        new URL(value)
      } catch (e) {
        return false
      }
      return true
    },
  },
  notification: 'creation.invalid.url',
  required: false,
}

export const VALIDATE_IP_AGAINST_MACHINE_CIDR = {
  contextTester: MACHINE_CIDR_CONTEXT_TESTER,
  notification: 'creation.ocp.cluster.valid.ip',
  required: true,
}

export const VALIDATE_IP_AGAINST_MACHINE_CIDR_OPTIONAL = {
  contextTester: MACHINE_CIDR_CONTEXT_TESTER,
  required: false,
}

export const VALIDATE_USER_AND_IP = {
  tester: new RegExp(
    '^[-.0-9a-z]+@(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3,4}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]+)*$'
  ),
  notification: 'creation.ocp.cluster.valid.user.ip',
  required: true,
}

export const VALIDATE_MAC_ADDRESS = {
  tester: new RegExp('^([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})$'),
  notification: 'creation.ocp.cluster.valid.mac',
  required: true,
}

export const VALIDATE_ALPHANUMERIC = {
  tester: new RegExp('^[A-Za-z0-9-_]+$'),
  notification: 'creation.valid.alphanumeric',
  required: false,
}

export const VALIDATE_NUMERIC = {
  tester: new RegExp('^[0-9]+$'),
  notification: 'creation.valid.numeric',
  required: true,
}

export const VALIDATE_ALPHANUMERIC_PERIOD = {
  tester: new RegExp('^[A-Za-z0-9-_.]+$'),
  notification: 'creation.ocp.cluster.valid.alphanumeric.period',
  required: false,
}

export const VALID_DNS_NAME = '^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$'
const VALID_DNS_NAME_TESTER = new RegExp(VALID_DNS_NAME)

// Tests for one or more path entries
export const VALID_REPOPATH = '^.+/[A-Za-z0-9]+(/[A-Za-z0-9-_\\.]*[A-Za-z0-9]+)*$'
const VALID_REPOPATH_TESTER = new RegExp(VALID_REPOPATH)

export const IMAGE_MIRROR_VALIDATOR = (value, i18n) => {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  const dnsName = value.split(':', 2)
  const errDnsName = BASE_DNS_NAME_VALIDATOR(dnsName[0], i18n)
  if (errDnsName) {
    return errDnsName
  }
  if (dnsName.length === 1) {
    return i18n('creation.ocp.cluster.valid.imageregistrymirror')
  }
  const port = dnsName[1].split('/', 2)
  if ((port.length === 1 && port[0].length === 0) || !VALIDATE_NUMERIC.tester.test(port[0])) {
    return i18n('creation.ocp.cluster.valid.port')
  }
  if (port.length === 1) {
    return i18n('creation.ocp.cluster.valid.imageregistrymirror')
  }
  if (!VALID_REPOPATH_TESTER.test(value)) {
    return i18n('creation.ocp.cluster.valid.repopath')
  }
  return null
}

export const BASE_DNS_NAME_VALIDATOR = (value, i18n) => {
  if (value && value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substr(1))) {
    return i18n('formerror.valid.baseDNSPeriod')
  }
  if (!VALID_DNS_NAME_TESTER.test(value)) {
    return i18n('formerror.valid.name')
  }
  return null
}

export const VALIDATE_BASE_DNS_NAME_REQUIRED = {
  contextTester: (value, templateObjectMap, i18n) => {
    return BASE_DNS_NAME_VALIDATOR(value, i18n)
  },
  notification: 'creation.ocp.cluster.missing.input',
  required: true,
}

export const VALID_DNS_LABEL = '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'

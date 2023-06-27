/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import IPCIDR from 'ip-cidr'
import { Address4, Address6 } from 'ip-address'
import { validateHttpsURL, validateNoProxy, VALID_DNS_NAME_TESTER } from '../../../lib/validation'
import { TFunction } from 'react-i18next'
import { getControlByID } from '../../../lib/temptifly-utils'

type Tester = {
  test: (value: string) => boolean
}

type ContextTester = (
  active: string,
  controlData: { id: string }[],
  templateObjectMap: Record<string, object>,
  t: TFunction
) => string | undefined

type Validator = {
  required: boolean
} & (
  | {
      tester: Tester
      notification: string
      contextTester?: never
    }
  | {
      tester?: never
      notification?: never
      contextTester: ContextTester
    }
)

const IP_ADDRESS_TESTER: Tester = {
  test: (value) => {
    try {
      new Address4(value)
      return true
    } catch {
      try {
        new Address6(value)
        return true
      } catch {
        return false
      }
    }
  },
}

export const getIPValidator = (
  options: {
    /** CIDR field to validate against */
    subnet?: { controlID: string; groupID: string }
    /** List of other IP fields that should contain unique values */
    differentFrom?: string[]
    /** Set to true if the field is not required */
    optional?: boolean
  } = {}
): Validator => {
  const { subnet, differentFrom, optional } = options || {}
  return {
    contextTester: (active, controlData, _templateObjectMap, t) => {
      if (!IP_ADDRESS_TESTER.test(active)) {
        return t('creation.ocp.cluster.valid.ip')
      }
      if (subnet) {
        const groupValues = getControlByID(controlData, subnet.groupID)?.active
        const subnetControls = (groupValues || [])
          .map((groupValue: any) => getControlByID(groupValue, subnet.controlID))
          .filter((subnetControl: any) => subnetControl)

        if (subnetControls.length) {
          const controlName = subnetControls[0].name
          const matchedSubnets = subnetControls.filter((subnetControl: any) => {
            const cidrString = subnetControl.active || ''
            const cidr = new IPCIDR(cidrString.toString())
            // if CIDR is invalid or not yet entered, validation will catch that
            return !cidr.isValid() || cidr.contains(active)
          })
          if (!matchedSubnets.length) {
            return t('creation.ocp.cluster.valid.cidr.membership', {
              controlName,
              subnetList: subnetControls.map((subnetControl: any) => subnetControl.active).join(', '),
            })
          }
        }
      }
      if (differentFrom) {
        const controlsWithSameValue = differentFrom
          .map((id) => getControlByID(controlData, id))
          .filter((control) => control && control.active === active)
        if (controlsWithSameValue.length) {
          return t('creation.ocp.cluster.duplicate.ip.address', {
            controlList: controlsWithSameValue.map((control) => control.name).join(', '),
          })
        }
      }
    },
    required: !optional,
  }
}

export const getCIDRValidator = (t: TFunction): Validator => ({
  tester: {
    test: (value) => {
      const cidr = new IPCIDR(value)
      // Ensure CIDR is valid and results in more than one address
      return cidr.isValid() && cidr.start() !== cidr.end()
    },
  },
  notification: t('creation.ocp.cluster.valid.cidr'),
  required: true,
})

export const getURLValidator = (t: TFunction): Validator => ({
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
  notification: t('creation.invalid.url'),
  required: true,
})

export const getHttpsURLValidator = (required: boolean): Validator => ({
  contextTester: (active, _controlData, _templateObjectMap, t) => validateHttpsURL(active, t),
  required,
})

export const getNoProxyValidator = (t: TFunction): Validator => ({
  tester: {
    test: (value) => !validateNoProxy(value, t),
  },
  notification: t(
    "Each value must be a domain name (optionally prefaced with '.' to match subdomains only), IP address, other network CIDR, or '*'."
  ),
  required: false,
})

export const getAlphanumericValidator = (t: TFunction): Validator => ({
  tester: /^[A-Za-z0-9-_]+$/,
  notification: t('creation.valid.alphanumeric'),
  required: false,
})

export const getNumericValidator = (t: TFunction): Validator => ({
  tester: /^\d+$/,
  notification: t('creation.valid.numeric'),
  required: true,
})

export const getAlphanumericWithPeriodValidator = (t: TFunction): Validator => ({
  tester: /^[A-Za-z0-9-_.]+$/,
  notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
  required: false,
})

// Tests for one or more path entries
export const VALID_REPOPATH = '^.+/[A-Za-z0-9]+(/[A-Za-z0-9-_\\.]*[A-Za-z0-9]+)*$'

const BASE_DNS_NAME_VALIDATOR = (value: string, t: TFunction) => {
  if (value && value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substring(1))) {
    return t('formerror.valid.baseDNSPeriod')
  }
  if (!VALID_DNS_NAME_TESTER.test(value)) {
    return t('formerror.valid.name')
  }
  return undefined
}

export const VALIDATE_BASE_DNS_NAME_REQUIRED: Validator = {
  contextTester: (value, _controlData, _templateObjectMap, t) => {
    return BASE_DNS_NAME_VALIDATOR(value, t)
  },
  required: true,
}

export const VALID_DNS_LABEL = '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'

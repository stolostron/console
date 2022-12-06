/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import IPCIDR from 'ip-cidr'
import { Address4, Address6 } from 'ip-address'
import { VALID_DNS_NAME_TESTER } from '../../../lib/validation'

const IP_ADDRESS_TESTER = {
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

export const getIPValidator = (t) => ({
    tester: IP_ADDRESS_TESTER,
    notification: t('creation.ocp.cluster.valid.ip'),
    required: true,
})

export const getOptionalIPValidator = (t) => ({
    tester: IP_ADDRESS_TESTER,
    notification: t('creation.ocp.cluster.valid.ip'),
    required: false,
})

export const getCIDRValidator = (t) => ({
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

export const getURLValidator = (t) => ({
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

export const getAlphanumericValidator = (t) => ({
    tester: new RegExp('^[A-Za-z0-9-_]+$'),
    notification: t('creation.valid.alphanumeric'),
    required: false,
})

export const getNumericValidator = (t) => ({
    tester: new RegExp('^[0-9]+$'),
    notification: t('creation.valid.numeric'),
    required: true,
})

export const getAlphanumericWithPeriodValidator = (t) => ({
    tester: new RegExp('^[A-Za-z0-9-_.]+$'),
    notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
    required: false,
})

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
    if ((port.length === 1 && port[0].length === 0) || !getNumericValidator(i18n).tester.test(port[0])) {
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
    required: true,
}

export const VALID_DNS_LABEL = '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'

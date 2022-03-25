/* Copyright Contributors to the Open Cluster Management project */

import YAML from 'yaml'

import { TFunction } from 'i18next'
import validator from 'validator'

const lowercaseAlphaNumericCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890'
export function validateKubernetesDnsName(value: string, t: TFunction) {
    if (value) {
        if (value.length > 63) return `${t('credentials:validate.kubernetesDnsName.length')}`
        for (const char of value) {
            if (!lowercaseAlphaNumericCharacters.includes(char) && char !== '-')
                return `${t('credentials:validate.kubernetesDnsName.char')}`
        }
        if (!lowercaseAlphaNumericCharacters.includes(value[0]))
            return `${t('credentials:validate.kubernetesDnsName.startchar')}`
        if (!lowercaseAlphaNumericCharacters.includes(value[value.length - 1]))
            return `${t('credentials:validate.kubernetesDnsName.endchar')}`
    }
    return undefined
}

export function validatePublicSshKey(value: string, t: TFunction) {
    if (value) {
        // Public SSH key should start with 'ssh-rsa' or 'ssh-dss', for example
        // Second token is a base64 value, with first integer being the length of the first token
        // (eg. 7 for RSA and DSA keys, 11 for ed25519 keys, etc.)
        const keyTypes = ['ssh-rsa', 'ssh-dss', 'ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp521']
        const tokens = value.trim().split(/\s+/)
        if (tokens.length >= 2) {
            if (keyTypes.includes(tokens[0])) {
                try {
                    const firstInteger = Buffer.from(tokens[1], 'base64').readInt32BE(0)
                    if (firstInteger === tokens[0].length) {
                        // Valid key; exit validation
                        return undefined
                    }
                } catch (e) {
                    // Fall through to error case
                }
            }
        }
    }
    return t('validate.publicSshKey')
}

export function validatePrivateSshKey(value: string, t: TFunction, requireNewline = true) {
    if (!/-----BEGIN [a-zA-Z]+ PRIVATE KEY-----\n([\s\S]*?)\n-----END [a-zA-Z]+ PRIVATE KEY-----/gm.test(value)) {
        return t('validate.privateSshKey')
    }
    if (requireNewline && !/[\r\n]$/.test(value)) {
        return t('validate.mustEndWithNewline')
    }
}

export function validateCertificate(value: string, t: TFunction) {
    if (!/-----BEGIN CERTIFICATE-----\n([\s\S]*?)\n-----END CERTIFICATE-----/gm.test(value)) {
        return t('validate.certificate')
    }
    return undefined
}

export function validateGCProjectID(value: string, t: TFunction) {
    const projectIDPattern = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/
    if (!projectIDPattern.test(value)) {
        return t('validate.projectID.format')
    }

    return undefined // the value is valid
}

export function validateJSON(value: string, t: TFunction) {
    try {
        const obj = JSON.parse(value)
        if (Object.entries(obj).length <= 0) {
            return t('credentials:validate.json')
        }
    } catch (e) {
        return t('credentials:validate.json')
    }
    return undefined
}
export function validateBaseDnsName(value: string, t: TFunction) {
    const VALID_DNS_NAME_TESTER = new RegExp('^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$')
    if (value && value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substring(1))) {
        return t('validate.baseDnsName.start')
    }
    if (!VALID_DNS_NAME_TESTER.test(value)) {
        return t('validate.baseDnsName.char')
    }

    return undefined
}

export function validateLibvirtURI(value: string, t: TFunction) {
    const VALID_LIBVIRT_PROTOCOLS = ['qemu+ssh']
    const protoValuePair = value.split('://')
    if (protoValuePair.length !== 2 || !VALID_LIBVIRT_PROTOCOLS.includes(protoValuePair[0])) {
        return t('validate.libevirtURI.format')
    }

    if (!protoValuePair[1]) {
        // whatever but not empty
        return t('validate.libevirtURI.format')
    }

    return undefined // the value is valid
}

export function validateImageMirror(value: string, t: TFunction) {
    const VALID_REPOPATH_TESTER = new RegExp('^.+/[A-Za-z0-9]+(/[A-Za-z0-9-_\\.]*[A-Za-z0-9]+)*$')
    const VALIDATE_NUMERIC_TESTER = new RegExp('^[0-9]+$')
    if (value.length === 0) {
        return undefined
    }
    const dnsName = value.split(':', 2)
    const errDnsName = validateBaseDnsName(dnsName[0], t)
    if (errDnsName) {
        return errDnsName
    }
    if (dnsName.length === 1) {
        return t('validate.imageMirror.format')
    }
    const port = dnsName[1].split('/', 2)
    if ((port.length === 1 && port[0].length === 0) || !VALIDATE_NUMERIC_TESTER.test(port[0])) {
        return t('validate.imageMirror.port')
    }
    if (port.length === 1) {
        return t('validate.imageMirror.format')
    }
    if (!VALID_REPOPATH_TESTER.test(value)) {
        return t('validate.imageMirror.repositorypath')
    }
    return undefined
}

export function validateBaseDomain(value: string, t: TFunction) {
    const VALID_DNS_NAME_TESTER = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
    if (value) {
        if (value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substring(1))) {
            return t('validate.baseDomain.baseDNSPeriod')
        }
        if (!VALID_DNS_NAME_TESTER.test(value)) {
            return t('validate.baseDomain.name')
        }
    }
    return undefined
}

export function validateCloudsYaml(yamlValue: string, cloudValue: string, t: TFunction) {
    if (yamlValue) {
        try {
            //ensure we have valid YAML
            const yamlData = YAML.parse(yamlValue) as {
                clouds: {
                    [cloud: string]: {
                        auth?: {
                            auth_url?: string
                            password?: string
                            username?: string
                        }
                    }
                }
            }

            //check for the clouds key
            const clouds = yamlData.clouds
            if (clouds === undefined) {
                return t('validate.yaml.not.valid')
            }

            let found = false
            for (const key in clouds) {
                //look for matching cloud name
                if (cloudValue !== undefined && key === cloudValue) {
                    found = true
                }
                //check a few of the required fields, especially password, since the user
                //would have had to add this manually
                if (
                    clouds[key]?.auth?.auth_url === undefined ||
                    clouds[key]?.auth?.password === undefined ||
                    clouds[key]?.auth?.username === undefined
                ) {
                    return t('validate.yaml.not.valid')
                }
            }
            //Uh-oh, cloud name not found in clouds.yaml
            if (cloudValue !== undefined && !found) {
                return t('validate.yaml.cloud.not.found')
            }
        } catch (e) {
            return t('validate.yaml.not.valid')
        }
    }
    return undefined
}

export function validateBareMetalOSImageURL(value: string, t: TFunction) {
    const VALID_BARE_METAL_OS_IMAGE_TESTER =
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)sha256=([a-fA-F0-9]{64})$/
    if (value) {
        if (value.length === 0) {
            return undefined
        }

        if (!VALID_BARE_METAL_OS_IMAGE_TESTER.test(value)) {
            return t('validate.os.image.url.not.valid')
        }
    }

    return undefined
}

export function validateWebURL(url: string, t: TFunction) {
    if (
        validator.isURL(url, {
            require_protocol: true,
            require_valid_protocol: true,
            protocols: ['http', 'https'],
            require_host: true,
        })
    )
        return undefined

    return t('validate.ansible.url.not.valid')
}

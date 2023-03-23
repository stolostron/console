/* Copyright Contributors to the Open Cluster Management project */

import YAML from 'yaml'

import { TFunction } from 'i18next'
import validator from 'validator'
import { IResource } from '../resources'
import set from 'lodash/set'

import isCidr from 'is-cidr'

const lowercaseAlphaNumericCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890'

export function validateKubernetesDnsName(value: string, t: TFunction) {
  if (value) {
    if (value.length > 63) return `${t('validate.kubernetesDnsName.length')}`
    for (const char of value) {
      if (!lowercaseAlphaNumericCharacters.includes(char) && char !== '-')
        return `${t('validate.kubernetesDnsName.char')}`
    }
    if (!lowercaseAlphaNumericCharacters.includes(value[0])) return `${t('validate.kubernetesDnsName.startchar')}`
    if (!lowercaseAlphaNumericCharacters.includes(value[value.length - 1]))
      return `${t('validate.kubernetesDnsName.endchar')}`
  }
  return undefined
}

export function validatePublicSshKey(value: string, t: TFunction, required: boolean) {
  if (!value && !required) {
    return undefined
  }
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
      return t('validate.json')
    }
  } catch (e) {
    return t('validate.json')
  }
  return undefined
}

export const VALID_DNS_NAME_TESTER = new RegExp('^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$')
export function validateBaseDnsName(value: string, t: TFunction) {
  if (value && value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substr(1))) {
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

export function validateBaseDomain(value: string, t: TFunction) {
  const VALID_DNS_NAME_TESTER = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
  if (value) {
    if (value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substr(1))) {
      return t('validate.baseDomain.baseDNSPeriod')
    }
    if (!VALID_DNS_NAME_TESTER.test(value)) {
      return t('validate.baseDomain.name')
    }
  }
  return undefined
}

// user provided ca but didn't add cacert key
export function enforceCloudsYaml(yamlValue: string, cloudValue: string, osCABundle: string) {
  if (yamlValue && cloudValue && osCABundle) {
    try {
      //ensure we have valid YAML
      const yamlData = YAML.parse(yamlValue) as {
        clouds: {
          [cloud: string]: {
            auth?: {
              cacert?: string
            }
          }
        }
      }
      if (!yamlData?.clouds[cloudValue]?.auth?.cacert) {
        set(yamlData, `clouds[${cloudValue}].auth.cacert`, '/etc/openstack-ca/ca.crt')
        return YAML.stringify(yamlData)
      }
    } catch (e) {}
  }
  return yamlValue
}

export function validateCloudsYaml(yamlValue: string, cloudValue: string, osCABundle: string, t: TFunction) {
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
              cacert?: string
            }
          }
        }
      }

      //check for the clouds key
      const clouds = yamlData.clouds
      if (clouds === undefined) {
        return t('validate.yaml.not.valid')
      }

      const cloud = clouds[cloudValue]
      if (!cloud) {
        return t('validate.yaml.cloud.not.found')
      }
      if (!cloud?.auth?.auth_url || !cloud?.auth?.password || !cloud?.auth?.username) {
        return t('validate.yaml.cloud.auth.not.found')
      }
      if (
        osCABundle &&
        cloud?.auth?.cacert &&
        cloud?.auth?.cacert !== '/etc/openstack-ca/ca.crt' &&
        cloud?.auth?.cacert !== '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem'
      ) {
        return t('validate.yaml.cloud.cacert.not.found')
      }
      if (cloud?.auth?.cacert && !osCABundle) {
        return t('validate.yaml.cloud.cacert.was.found')
      }
    } catch (e) {
      return t('validate.yaml.not.valid')
    }
  }
  return undefined
}

export function validateAnsibleHost(url: string, t: TFunction, supportedProtocols?: string[]) {
  const protocols = supportedProtocols ? supportedProtocols : ['http', 'https']
  if (
    validator.isURL(url, {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: protocols,
      require_host: true,
    })
  )
    return undefined
  return t('validate.ansible.url.not.valid')
}

export function validateWebURL(url: string, _item: unknown, t?: TFunction) {
  t = t ? t : (value) => value
  if (
    validator.isURL(url, {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      require_host: true,
    })
  )
    return undefined
  return `${t('The URL is not valid.')}`
}

export function validateImageContentSources(value: string, t: TFunction) {
  if (value) {
    try {
      //ensure we have valid YAML
      const yamlData: { mirrors?: string[]; source?: string }[] = YAML.parse(value)
      const isValid = yamlData.every((item) => {
        return Array.isArray(item.mirrors) && item.source
      })

      //check for the clouds key
      if (!isValid) {
        return t('validate.yaml.not.valid')
      }
    } catch (e) {
      return t('validate.yaml.not.valid')
    }
  }
  return undefined
}

export function validateYAML(value: string, t: TFunction) {
  if (value) {
    try {
      YAML.parse(value)
    } catch (e) {
      return t('validate.yaml.not.valid')
    }
  }
  return undefined
}

export function validateHttpProxy(value: string, t: TFunction) {
  if (value) {
    if (
      validator.isURL(value, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http'],
        require_host: true,
      })
    )
      return undefined
    return t('validate.http.proxy.url.not.valid')
  }
  return undefined
}

export function validateHttpsProxy(value: string, t: TFunction) {
  if (value) {
    if (
      validator.isURL(value, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http', 'https'],
        require_host: true,
      })
    )
      return undefined
    return t('validate.https.proxy.url.not.valid')
  }
  return undefined
}

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

const FQDN_OPTIONS = { require_tld: false }
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

export function validateNoProxyList(value: string, t: TFunction) {
  if (value) {
    const noProxies = value.split(',')
    if (noProxies) {
      let validationMessage
      const validationFailed = noProxies.some((noProxy) => {
        validationMessage = validateNoProxy(noProxy, t)
        return !!validationMessage
      })
      if (validationFailed) {
        return validationMessage
      }
    }
  }
  return undefined
}

export function validateKubernetesResourceName(value: string, _item: unknown, t?: TFunction) {
  t = t ? t : (value) => value
  if (!value) return undefined
  if (value.length > 253) return `${t('This value can contain at most 253 characters')}`
  for (const char of value) {
    if (!lowercaseAlphaNumericCharacters.includes(char) && char !== '-' && char !== '.')
      return `${t("This value can only contain lowercase alphanumeric characters or '-' or '.'")}`
  }
  if (!lowercaseAlphaNumericCharacters.includes(value[0]))
    return `${t('This value must start with an alphanumeric character')}`
  if (!lowercaseAlphaNumericCharacters.includes(value[value.length - 1]))
    return `${t('This value must end with an alphanumeric character')}`
  return undefined
}

export function validatePolicyName(value: string, resource: unknown, t?: TFunction) {
  t = t ? t : (value) => value
  const error = validateKubernetesResourceName(value, t)
  if (error) return error
  const policy = resource as IResource
  const namespace = policy.metadata?.namespace ?? ''
  const combinedNameLength = value.length + namespace.length + 1

  if (combinedNameLength > 63)
    return t(
      'The combined length of namespace and policy name (namespaceName.policyName) must not exceed 63 characters'
    )
  return undefined
}

export function validateAppSetName(value: string, resource: unknown, t?: TFunction) {
  t = t ? t : (value) => value
  const error = validateKubernetesResourceName(value, t)
  if (error) return error
  const appSet = resource as IResource
  if (appSet && value.length > 53) return t('The length of application set name must not exceed 53 characters')
  return undefined
}

export function validateRequiredPrefix(value: string, requiredPrefix: string, t: TFunction) {
  if (value && !value?.startsWith(requiredPrefix)) {
    return t("The path must begin with '{{prefix}}'", { prefix: requiredPrefix })
  }
  return undefined
}

export function validateVCenterServer(value: string, t: TFunction) {
  if (!validator.isFQDN(value) && !validator.isIP(value)) {
    if (value && value.indexOf('://') > 0) {
      const scheme = value.split('://')[0]
      return t(
        "The value must be a fully-qualified host name or IP address. Do not include the '{{scheme}}://' URL scheme.",
        { scheme }
      )
    } else {
      return t('The value must be a fully-qualified host name or IP address.')
    }
  }
}

export function validateCidr(value: string, t: TFunction) {
  if (value == '') {
    return undefined
  }

  if (isCidr(value)) {
    return undefined
  }
  return t('Value must be a valid IPv4 CIDR.')
}

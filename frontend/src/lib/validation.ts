const lowercaseAlphaNumericCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890'
export function validateKubernetesDnsName(value: string, name: string) {
    if (value) {
        if (value.length > 63) return `${name} can contain at most 63 characters.`
        for (const char of value) {
            if (!lowercaseAlphaNumericCharacters.includes(char) && char !== '-' && char !== '.')
                return `${name} can only contain lowercase alphanumeric characters, '-' or '.'`
        }
        if (!lowercaseAlphaNumericCharacters.includes(value[0]))
            return `${name} must start with an alphanumeric character`
        if (!lowercaseAlphaNumericCharacters.includes(value[value.length - 1]))
            return `${name} must end with an alphanumeric character`
    }
    return undefined
}

export function validatePublicSshKey(value: string) {
    if (value) {
        // Public SSH key should start with 'ssh-rsa' or 'ssh-dss', for example
        // Second token is a base64 value, with first integer being the length of the first token
        // (eg. 7 for RSA and DSA keys, 11 for ed25519 keys, etc.)
        const keyTypes = ['ssh-rsa', 'ssh-dss', 'ssh-ed25519', 'ecdsa-sha2-nistp256']
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
    return 'Public key required'
}

export function validatePrivateSshKey(value: string) {
    if (value) {
        const regExp = new RegExp('^-----BEGIN.*KEY-----$')
        if (!regExp.test(value.split('\n').join('').split('\r').join('').trim()))
            return 'Must be a valid private ssh key.'
    }

    return undefined
}

export function validateCertificate(value: string) {
    if (!/-----BEGIN CERTIFICATE-----\n([\s\S]*?)\n-----END CERTIFICATE-----/gm.test(value)) {
        return 'Certificate required'
    }
    return undefined
}

export function validateGCProjectID(value: string) {
    const gcProjectIDPattern = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/
    if (!gcProjectIDPattern.test(value)) {
        return `Must consist of 6 to 30 lowercase alphanumeric characters or '-', and must start with a letter and not end with '-'`
    }

    return undefined // the value is valid
}

export function validateJSON(value: string) {
    try {
        const obj = JSON.parse(value)
        if (Object.entries(obj).length <= 0) {
            return 'JSON required'
        }
    } catch (e) {
        return 'JSON required'
    }
    return undefined
}

export function validateLibvirtURI(value: string) {
    const VALID_LIBVIRT_PROTOCOLS = ['qemu+ssh']
    const protoValuePair = value.split('://')
    if (protoValuePair.length !== 2 || !VALID_LIBVIRT_PROTOCOLS.includes(protoValuePair[0])) {
        return `Provide valid Libvirt URI (driver[+transport]://[username@][hostname][:port]/[path][?extraparameters] )`
    }

    if (!protoValuePair[1]) {
        // whatever but not empty
        return `Provide valid Libvirt URI (driver[+transport]://[username@][hostname][:port]/[path][?extraparameters] )`
    }

    return undefined // the value is valid
}

export function validateBaseDNSName(value: string) {
    const VALID_DNS_NAME_TESTER = new RegExp('^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$')
    if (value && value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substr(1))) {
        return 'The base DNS domain must not begin with a period.'
    }
    if (!VALID_DNS_NAME_TESTER.test(value)) {
        return `Must consist of lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character`
    }

    return undefined
}

export function validateImageMirror(value: string) {
    const VALID_REPOPATH_TESTER = new RegExp('^.+/[A-Za-z0-9]+(/[A-Za-z0-9-_\\.]*[A-Za-z0-9]+)*$')
    const VALIDATE_NUMERIC_TESTER = new RegExp('^[0-9]+$')
    if (value.length === 0) {
        return undefined
    }
    const dnsName = value.split(':', 2)
    const errDnsName = validateBaseDNSName(dnsName[0])
    if (errDnsName) {
        return errDnsName
    }
    if (dnsName.length === 1) {
        return 'Value must have the format HOSTNAME:PORT/PATH'
    }
    const port = dnsName[1].split('/', 2)
    if ((port.length === 1 && port[0].length === 0) || !VALIDATE_NUMERIC_TESTER.test(port[0])) {
        return 'Value must be an integer port value'
    }
    if (port.length === 1) {
        return 'Value must have the format HOSTNAME:PORT/PATH'
    }
    if (!VALID_REPOPATH_TESTER.test(value)) {
        return `Value for the repository path must consist of alphanumeric characters, '-', '.' or '_', and must start and end with an alphanumeric character`
    }
    return undefined
}

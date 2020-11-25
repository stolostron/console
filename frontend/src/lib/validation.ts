const lowercaseAlphaNumericCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890'
export function validateKubernetesDnsName(value: string, name: string) {
    if (value) {
        if (value.length > 63) return `${name} can contain at most 63 characters.`
        for (const char of value) {
            if (!lowercaseAlphaNumericCharacters.includes(char) && char !== '-')
                return `${name} can only contain lowercase alphanumeric characters or '-'`
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
        const regExp = new RegExp('^ssh-.*')
        if (!regExp.test(value.split('\n').join('').split('\r').join('').trim()))
            return 'Must be a valid public ssh key.'
    }
    return undefined
}

export function validatePrivateSshKey(value: string) {
    if (value) {
        const regExp = new RegExp('^-----BEGIN.*KEY-----$')
        if (!regExp.test(value.split('\n').join('').split('\r').join('').trim()))
            return 'Must be a valid private ssh key.'
    }

    return undefined
}

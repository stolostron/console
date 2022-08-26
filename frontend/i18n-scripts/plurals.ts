/* Copyright Contributors to the Open Cluster Management project */

const OLD_PLURAL = '_plural'
const NEW_PLURAL = '_other'
const NEW_SINGULAR = '_one'

const DUPLICATIONS: [string, string][] = [
    [OLD_PLURAL, NEW_PLURAL],
    [NEW_PLURAL, OLD_PLURAL],
    [NEW_SINGULAR, ''],
    // Old singular is a lack of suffix, which is the fallback when _one is missing; no need to duplicate
]

export function transformPlurals(input: Record<string, string>): Record<string, string> {
    for (const key of Object.keys(input)) {
        for (const [existingSuffix, suffixToAdd] of DUPLICATIONS) {
            if (key.endsWith(existingSuffix)) {
                const keyToAdd = `${key.slice(0, -(existingSuffix.length))}${suffixToAdd}`
                if (!input[keyToAdd]) {
                    input[keyToAdd] = input[key]
                    console.log(`transformPlurals added key '${keyToAdd}'`)
                }
            }
        }
    }
    return input
}

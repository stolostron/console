/* istanbul ignore file */
import { readFileSync } from 'fs'

export function loadConfig(): void {
    if (process.env.NODE_ENV === 'development') {
        try {
            const lines = readFileSync('.env').toString().split('\n')
            for (const line of lines) {
                const parts = line.split('=')
                if (parts.length === 2) {
                    process.env[parts[0]] = parts[1]
                }
            }
        } catch (err) {
            // Do Nothing
        }
    }
}

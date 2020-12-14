export type LogEntry = string | number | Error
export type Log = LogEntry[]
export type Logs = Log[]

const Reset = process.env.NODE_ENV !== 'production' ? '\x1b[0m' : ''
// const Bright = process.env.NODE_ENV !== 'production' ? '\x1b[1m' : ''
const Dim = process.env.NODE_ENV !== 'production' ? '\x1b[2m' : ''

// const FgBlack = process.env.NODE_ENV !== 'production' ? '\x1b[30m' : ''
const FgRed = process.env.NODE_ENV !== 'production' ? '\x1b[31m' : ''
const FgGreen = process.env.NODE_ENV !== 'production' ? '\x1b[32m' : ''
// const FgYellow = process.env.NODE_ENV !== 'production' ? '\x1b[33m' : ''
const FgBlue = process.env.NODE_ENV !== 'production' ? '\x1b[34m' : ''
// const FgMagenta = process.env.NODE_ENV !== 'production' ? '\x1b[35m' : ''
// const FgCyan = process.env.NODE_ENV !== 'production' ? '\x1b[36m' : ''
// const FgWhite = process.env.NODE_ENV !== 'production' ? '\x1b[37m' : ''

function writeLogEntry(logEntry: unknown) {
    if (typeof logEntry === 'string') {
        return logEntry
    } else if (typeof logEntry === 'number') {
        return logEntry.toString()
    } else {
        return 'UNKNOWN'
    }
}

function writeLogs(logs: Logs, type: string): void {
    let lines = ''
    let index = 0
    for (const log of logs) {
        if (index++ === 0) {
            lines += type
            lines += ' '
        } else {
            lines += `      ${Dim}`
        }
        let index2 = 0
        for (const logEntry of log) {
            if (index2++ !== 0) lines += ' '
            lines += writeLogEntry(logEntry)
        }
        lines += `${Reset}\n`
    }
    lines += '\n'
    process.stdout.write(lines)
}

export const logInfo: (logs: Logs) => void = infoFunc
export const logDebug: (logs: Logs) => void = debugFunc
export const logError: (logs: Logs) => void = errorFunc

function infoFunc(logs: Logs): void {
    writeLogs(logs, `${FgGreen} INFO${Reset}`)
}

function debugFunc(logs: Logs): void {
    writeLogs(logs, `${FgBlue}DEBUG${Reset}`)
}

function errorFunc(logs: Logs): void {
    writeLogs(logs, `${FgRed}ERROR${Reset}`)
}

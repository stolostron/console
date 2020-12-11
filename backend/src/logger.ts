export type LogEntry = string | number | Error
export type Log = LogEntry[]
export type Logs = Log[]

const Reset = '\x1b[0m'
const Bright = '\x1b[1m'
const Dim = '\x1b[2m'
const Underscore = '\x1b[4m'
const Blink = '\x1b[5m'
const Reverse = '\x1b[7m'
const Hidden = '\x1b[8m'

const FgBlack = '\x1b[30m'
const FgRed = '\x1b[31m'
const FgGreen = '\x1b[32m'
const FgYellow = '\x1b[33m'
const FgBlue = '\x1b[34m'
const FgMagenta = '\x1b[35m'
const FgCyan = '\x1b[36m'
const FgWhite = '\x1b[37m'

const BgBlack = '\x1b[40m'
const BgRed = '\x1b[41m'
const BgGreen = '\x1b[42m'
const BgYellow = '\x1b[43m'
const BgBlue = '\x1b[44m'
const BgMagenta = '\x1b[45m'
const BgCyan = '\x1b[46m'
const BgWhite = '\x1b[47m'

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
            lines += type.padStart(5)
            lines += ' '
        } else {
            lines += `      ${Dim}`
        }
        let index2 = 0
        for (const logEntry of log) {
            if (index2++ !== 0) {
                lines += ' '
            }
            lines += writeLogEntry(logEntry)
        }
        lines += `${Reset}\n`
    }
    lines += '\n'
    if (type === 'ERROR') {
        process.stderr.write(lines)
    } else {
        process.stdout.write(lines)
    }
}

export const logInfo: (logs: Logs) => void = infoFunc
export const logDebug: (logs: Logs) => void = debugFunc
export const logError: (logs: Logs) => void = errorFunc

function infoFunc(logs: Logs): void {
    writeLogs(logs, 'INFO')
}

function debugFunc(logs: Logs): void {
    writeLogs(logs, 'DEBUG')
}

function errorFunc(logs: Logs): void {
    writeLogs(logs, 'ERROR')
}

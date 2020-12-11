export type LogEntry = string | number | Error
export type Log = LogEntry[]
export type Logs = Log[]

function writeLogEntry(logEntry: unknown) {
    if (typeof logEntry === 'string') {
        return logEntry
    } else if (typeof logEntry === 'number') {
        return logEntry.toString()
    } else {
        return 'UNKNOWN'
    }
}

export function info(logs: Logs): void {
    let index = 0
    for (const log of logs) {
        let line = ''
        if (index++ === 0) {
            line += ' INFO '
        } else {
            line += '      '
        }
        let index2 = 0
        for (const logEntry of log) {
            if (index2++ !== 0) {
                line += ' '
            }
            line += writeLogEntry(logEntry)
        }
        line += '\n'
        process.stdout.write(line)
    }
}

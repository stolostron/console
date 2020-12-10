export type LogEntry = string | number | Error
export type Log = LogEntry[]
export type Logs = Log[]

const Reset = '\x1b[0m'

const Dim = '\x1b[2m'
const FgGreen = '\x1b[32m'

function writeLogEntry(logEntry: unknown) {
    if (typeof logEntry === 'string') {
        process.stdout.write(logEntry)
    } else if (typeof logEntry === 'number') {
        process.stdout.write(logEntry.toString())
    } else {
        process.stdout.write('UNKNOWN')
    }
}

export function info(logs: Logs): void {
    let index = 0
    for (const log of logs) {
        if (index++ === 0) {
            process.stdout.write(FgGreen)
            process.stdout.write(' INFO ')
            process.stdout.write(Reset)
        } else {
            process.stdout.write(Dim)
            process.stdout.write('      ')
        }
        let index2 = 0
        for (const logEntry of log) {
            if (index2++ !== 0) {
                process.stdout.write(' ')
            }
            writeLogEntry(logEntry)
        }
        process.stdout.write(Reset)
        process.stdout.write('\n')
    }
}

/* Copyright Contributors to the Open Cluster Management project */
import events from 'events'
import { createReadStream } from 'fs'
import { lstat, readdir } from 'fs/promises'
import { join } from 'path'
import readline from 'readline'

const ignoreDirectories = ['.git', 'node_modules', 'coverage', 'build', 'lib', 'dist']

async function checkFile(path: string) {
    try {
        let found = false
        const rl = readline
            .createInterface({
                input: createReadStream(path),
                crlfDelay: Infinity,
            })
            .on('line', (line) => {
                if (line.includes('Copyright Contributors to the Open Cluster Management project')) {
                    found = true
                    rl.close()
                }
            })
        await events.once(rl, 'close')
        if (found) process.exitCode = 0
        else {
            console.log('error:', path, 'needs Copyright')
            process.exitCode = 1
        }
    } catch (err) {
        console.error(err)
    }
}

export async function checkCopyright(directory: string, extensions = ['.ts', '.tsx', '.js']): Promise<void> {
    const names = await readdir(directory)
    for (const name of names) {
        if (ignoreDirectories.find((ignore) => name.includes(ignore))) continue
        const path = join(directory, name)
        const stats = await lstat(path)
        if (stats.isDirectory()) {
            void checkCopyright(path)
        }
        if (!extensions.find((ext) => name.endsWith(ext))) continue
        checkFile(path)
    }
}

void checkCopyright('.')

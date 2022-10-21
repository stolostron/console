/* Copyright Contributors to the Open Cluster Management project */
import events from 'events'
import { createReadStream } from 'fs'
import readline from 'readline'
import { executeCopyrightAction } from './copyright'

async function checkFile(path: string): Promise<boolean> {
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
        if (!found) {
            console.log('error:', path, 'needs Copyright')
        }
        return found
    } catch (err) {
        console.error(err)
        return false
    }
}

executeCopyrightAction(checkFile)

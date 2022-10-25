/* Copyright Contributors to the Open Cluster Management project */
import { readFile, writeFile } from 'fs/promises'
import { executeCopyrightAction } from './copyright'

export async function fixCopyright(path: string): Promise<boolean> {
    try {
        const file = await readFile(path)
        if (!file.toString().includes('Copyright Contributors to the Open Cluster Management project')) {
            const fixed = '/* Copyright Contributors to the Open Cluster Management project */\n' + file.toString()
            console.log('fixed:', path)
            void writeFile(path, fixed)
        }
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

executeCopyrightAction(fixCopyright)

/* Copyright Contributors to the Open Cluster Management project */
import { lstat, readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const ignoreDirectories = ['.git', 'node_modules', 'coverage', 'build', 'dist', 'cypress_cache']

var filesChanged = false

export async function fixCopyright(directory: string, extensions = ['.ts', '.tsx', '.js']): Promise<void> {
    const names = await readdir(directory)
    for (const name of names) {
        if (ignoreDirectories.find((ignore) => name.includes(ignore))) continue
        const path = join(directory, name)
        const stats = await lstat(path)
        if (stats.isDirectory()) {
            await fixCopyright(path)
        }
        if (!extensions.find((ext) => name.endsWith(ext))) continue
        const file = await readFile(path)
        if (!file.toString().includes('Copyright Contributors to the Open Cluster Management project')) {
            const fixed = '/* Copyright Contributors to the Open Cluster Management project */\n' + file.toString()
            console.log('fixed:', path)
            void writeFile(path, fixed)
            filesChanged = true
        }
    }
}

fixCopyright('.').then(() => {
    // exit code 1 if files change to block pre-commit
    process.exit(filesChanged ? 1 : 0)
})

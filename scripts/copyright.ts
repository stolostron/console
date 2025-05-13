/* Copyright Contributors to the Open Cluster Management project */
import { lstat, readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const ignoreDirectories = ['.git', 'node_modules', 'coverage', 'build', 'dist', 'lib']
const extensions = ['.ts', '.tsx', '.js']

export type CopyrightAction = (path: string) => Promise<boolean>

export function executeCopyrightAction(action: CopyrightAction) {
    let failed = false

    async function copyrightPath(path: string, action: CopyrightAction) {
        const stats = await lstat(path)
        if (stats.isDirectory()) {
            await copyrightDirectory(path, action)
        } else if (extensions.find((ext) => path.endsWith(ext))) {
            if (!(await action(path))) {
                failed = true
            }
        }
    }

    async function copyrightDirectory(directory: string, action: CopyrightAction) {
        const names = await readdir(directory)
        for (const name of names) {
            if (ignoreDirectories.find((ignore) => name.includes(ignore))) continue
            const path = join(directory, name)
            await copyrightPath(path, action)
        }
    }

    const paths = process.argv.slice(2)

    ;(paths.length ? Promise.all(paths.map((p) => copyrightPath(p, action))) : copyrightDirectory('.', action)).then(
        () => {
            if (failed) {
                process.exit(1)
            }
        }
    )
}

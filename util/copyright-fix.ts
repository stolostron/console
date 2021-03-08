/* Copyright Contributors to the Open Cluster Management project */
import { lstat, readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const ignoreDirectories = [".git", "node_modules", "coverage", "build"];

export async function fixCopyright(
    directory: string,
    extensions = [".ts", ".tsx", ".js"]
): Promise<void> {
    const names = await readdir(directory);
    for (const name of names) {
        if (ignoreDirectories.find((ignore) => name.includes(ignore))) continue;
        const path = join(directory, name);
        const stats = await lstat(path);
        if (stats.isDirectory()) {
            void fixCopyright(path);
        }
        if (!extensions.find((ext) => name.endsWith(ext))) continue;
        const file = await readFile(path);
        if (
            !file
                .toString()
                .startsWith(
                    "/* Copyright Contributors to the Open Cluster Management project */\n"
                )
        ) {
            process.exitCode = 1;
            const fixed =
                "/* Copyright Contributors to the Open Cluster Management project */\n" +
                file.toString();
            console.log("fixed:", path);
            void writeFile(path, fixed);
        }
    }
}

void fixCopyright(".");

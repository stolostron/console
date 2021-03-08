/* Copyright Contributors to the Open Cluster Management project */
import { lstat, readdir, readFile } from "fs/promises";
import { join } from "path";

const ignoreDirectories = [".git", "node_modules", "coverage"];

export async function checkCopyright(
    directory: string,
    extensions = [".ts"]
): Promise<void> {
    const names = await readdir(directory);
    for (const name of names) {
        if (ignoreDirectories.find((ignore) => name.includes(ignore))) continue;
        const path = join(directory, name);
        const stats = await lstat(path);
        if (stats.isDirectory()) {
            void checkCopyright(path);
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
            console.log("error:", path, "needs Copyright");
            process.exitCode = 1;
        }
    }
}

void checkCopyright(".");

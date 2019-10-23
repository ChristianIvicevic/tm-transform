import * as fs from "fs";
import * as path from "path";
import { transformAsciidocToHtml } from "tmt/transformers/asciidocTransformer";
import { createLogger } from "tmt/utils/logging";
import * as yargs from "yargs";

const log = createLogger("main");

//eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
    const { directory, file, plugin } = yargs.options({
        file: {
            type: "string",
            alias: "f",
            conflicts: ["directory"] as const,
            description: "Single file to parse and transform.",
        },
        directory: {
            type: "string",
            alias: "d",
            conflicts: ["file"] as const,
            description: "Directory to parse and transform. Does not work recursively.",
        },
        plugin: {
            choices: ["asciidoc"] as const,
            alias: "p",
            demandOption: "You must select a transformer plugin.",
            description: "Transformer plugin to execute on the selected files and/or directories.",
        },
    }).argv;
    if (directory === undefined && file === undefined) {
        log.error("Either the directory or file option have to be set, but neither both nor none.");
        process.exit(1);
        return;
    }
    const files =
        file !== undefined
            ? [file]
            : directory !== undefined
            ? fs.readdirSync(path.normalize(directory)).map((currentFile) => path.join(directory, currentFile))
            : [];

    switch (plugin) {
        case "asciidoc":
            files
                .filter((currentFile) => path.extname(currentFile) === ".html")
                .forEach(async (currentFile) => {
                    log.info(`Transforming file '${currentFile}' using '${plugin}'`);
                    const hasTransformed = await transformAsciidocToHtml(currentFile);
                    if (!hasTransformed) {
                        log.error(`Error transforming file '${currentFile}'. Aborting.`);
                        process.exit(1);
                        return;
                    }
                });
            break;

        default:
            process.exit();
    }
})();

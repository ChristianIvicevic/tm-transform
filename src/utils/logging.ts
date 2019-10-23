// eslint-disable-next-line import/default
import ansiRegex from "ansi-regex";
// eslint-disable-next-line import/default
import callsites from "callsites";
import chalk from "chalk";
import dedent from "dedent";
import * as path from "path";
import stripAnsi from "strip-ansi";
import * as winston from "winston";

const LEVEL_TARGET_LENGTH = 7;
const NAMESPACE_TARGET_LENGTH = 8;
const SCOPE_NAME_TARGET_LENGTH = 15;

const abbreviate = (scopeName: string, targetLength: number) => {
    const totalLength = scopeName.length;
    const parts = scopeName.split(".");
    const dots = parts.length - 1;

    if (totalLength <= targetLength || dots === 0) {
        return scopeName;
    }

    const baseName = parts.pop();
    const predictedLengths = parts.reduce(
        (previousLengths, part) => [
            ...previousLengths,
            previousLengths[previousLengths.length - 1] - (part.length - 1),
        ],
        [totalLength]
    );
    const abbreviatedParts = parts.map((part, i) => (predictedLengths[i] > targetLength ? part[0] : part));

    return [...abbreviatedParts, baseName].join(".");
};

const formatCallsite = (callsite: string) => {
    const parsedCallsite = path.parse(callsite);
    const callsiteFileName = parsedCallsite.name;
    const sourceFolder = process.mainModule !== undefined ? path.parse(process.mainModule.filename).dir : "";
    const scope = [...parsedCallsite.dir.substr(sourceFolder.length).split(path.sep), callsiteFileName]
        .filter(Boolean)
        .join(".")
        .replace(/\.index$/, "");
    return abbreviate(scope, SCOPE_NAME_TARGET_LENGTH);
};

export const createLogger = (namespace: string, callsiteIndex = 1) => {
    const callsite = callsites()[callsiteIndex].getFileName();
    const formattedCallsite = callsite !== null ? formatCallsite(callsite) : "internal";
    const logger = winston.createLogger({
        level: "silly",
        format: winston.format.combine(
            winston.format.label({ label: namespace }),
            winston.format.colorize(),
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
            winston.format.printf(({ timestamp, level, message }) => {
                // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
                const ansiCodes = level.match(ansiRegex());
                const formattedLevel =
                    ansiCodes !== null && ansiCodes.length === 2
                        ? `${ansiCodes[0]}${stripAnsi(level)
                              .toUpperCase()
                              .padStart(LEVEL_TARGET_LENGTH)}${ansiCodes[1]}`
                        : level;
                // Remove sketchy Windows path separators
                const formattedMessage = message.replace(/\\/g, "/");
                return dedent`
                        ${chalk.dim.gray(timestamp as string)} \
                        ${formattedLevel} \
                        ${chalk.dim.magenta(process.pid.toString())} --- \
                        [${chalk.dim.cyan(namespace.padStart(NAMESPACE_TARGET_LENGTH))}] \
                        ${chalk.yellow(formattedCallsite.padEnd(SCOPE_NAME_TARGET_LENGTH))} : \
                        ${formattedMessage}
                    `;
            })
        ),
        transports: [new winston.transports.Console()],
    });

    // Hook into the following log levels to enable multiline printing which winston doesn't support by default
    const logLevels: readonly (keyof Pick<winston.Logger, "error" | "warn" | "info" | "verbose" | "debug">)[] = [
        "error",
        "warn",
        "info",
        "verbose",
        "debug",
    ];
    logLevels.forEach((key) => {
        const original = logger[key];
        logger[key] = (message: string | object, ...args: unknown[]) =>
            typeof message === "string"
                ? message.split("\n").reduce((_, str) => original(str, ...args), logger)
                : original(message);
    });

    return logger;
};

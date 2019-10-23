import { paramCase } from "change-case";
import * as eol from "eol";
import * as fs from "fs";
import { AllHtmlEntities } from "html-entities";
import { parseFromLines } from "tmt/parser";
import { TextmateLanguage, TextmateScope } from "tmt/scopes";
import { parseCompilerErrors } from "tmt/transformers/asciidocPlugins/compilerErrorPlugin";
import { parseConums, transformConums } from "tmt/transformers/asciidocPlugins/conumPlugin";
import {
    doNotRecompileAnnotation,
    prependDoNotRecompileAnnotation,
} from "tmt/transformers/asciidocPlugins/doNotRecompilePlugin";
import { parseTypeHints } from "tmt/transformers/asciidocPlugins/typeHintPlugin";
import { createLogger } from "tmt/utils/logging";

export type AsciidocTransformerOptions = {
    /**
     * Boolean value indicating whether generated span elements should include a title attribute with the scope of the
     * token displayed.
     */
    writeScopes?: boolean;
};

const log = createLogger("tmsp");
const entities = new AllHtmlEntities();

const wrapWithSpan = (text: string, scopes: TextmateScope[], options?: AsciidocTransformerOptions) =>
    text.trim().length === 0
        ? text
        : `<span class="token ${paramCase(scopes[scopes.length - 1])}"${
              // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
              options && options.writeScopes ? ` title="${paramCase(scopes[scopes.length - 1])}"` : ""
          }>${entities.encode(text)}</span>`;

const parseAsciicodeListingToHtml = async (
    language: TextmateLanguage,
    sourceCode: string,
    options?: AsciidocTransformerOptions
) =>
    (await parseFromLines(language, eol.split(sourceCode)))
        .map((tokens) =>
            tokens.reduce<string[]>(
                (currentSourceLines, { lineIndex, scopes, text }) => [
                    ...currentSourceLines.slice(0, lineIndex),
                    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                    `${currentSourceLines[lineIndex] || ""}${wrapWithSpan(text, scopes, options)}`,
                ],
                []
            )
        )
        .orUndefined();

export const transformAsciidocToHtml = async (file: string, options?: AsciidocTransformerOptions) => {
    if (!fs.existsSync(file)) {
        log.error(`Cannot parse file '${file}'. File not found.`);
        return false;
    }

    const sourceContent = fs.readFileSync(file).toString();

    if (sourceContent.startsWith(doNotRecompileAnnotation)) {
        log.warn(`The file '${file}' has already been parsed.`);
        return true;
    }

    const preprocessingPlugins = [transformConums];
    const preprocessedContent = preprocessingPlugins.reduce(
        (currentContent, plugin) => plugin(currentContent),
        sourceContent
    );

    const parsedContent = await [
        ...preprocessedContent.matchAll(
            /<pre class="highlight"><code class="language-(.+?)" data-lang="(.+?)">(.+?)<\/code><\/pre>/gs
        ),
    ].reduce(async (currentSourceContent, match) => {
        const parsedOutput = await parseAsciicodeListingToHtml(
            match[1] as TextmateLanguage,
            entities.decode(match[3]),
            options
        );
        return parsedOutput === undefined
            ? currentSourceContent
            : (await currentSourceContent).replace(
                  match[0],
                  [
                      '<table class="highlight">',
                      `<tbody data-lang="${match[1]}">`,
                      ...parsedOutput.map(
                          // The nbsp is necessary for empty lines, otherwise they have a height of 0px.
                          (line) => `<tr><td class="blob-code">${line.length !== 0 ? line : "&nbsp;"}</td></tr>`
                      ),
                      "</tbody>",
                      "</table>",
                  ].join("\n")
              );
    }, Promise.resolve(preprocessedContent));

    const postProcessingPlugins = [parseConums, parseTypeHints, parseCompilerErrors, prependDoNotRecompileAnnotation];

    const postprocessedContent = postProcessingPlugins.reduce(
        (currentContent, plugin) => plugin(currentContent),
        parsedContent
    );

    fs.writeFileSync(file, postprocessedContent);

    return true;
};

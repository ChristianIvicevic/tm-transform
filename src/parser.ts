import { jsonTextmateGrammar } from "tmt/languages/JSON.tmLanguage";
import { typescriptTextmateGrammar } from "tmt/languages/TypeScript.tmLanguage";
import { typescriptReactTextmateGrammar } from "tmt/languages/TypeScriptReact.tmLanguage";
import { languageScopeNames, TextmateLanguage, TextmateLanguageScope, TextmateScope } from "tmt/scopes";
import { createLogger } from "tmt/utils/logging";
import { Optional } from "typescript-optional";
import { INITIAL, parseRawGrammar, Registry, StackElement } from "vscode-textmate";

const log = createLogger("tmsp");

type Token = Readonly<{
    lineIndex: number;
    startIndex: number;
    endIndex: number;
    scopes: TextmateScope[];
    text: string;
}>;

const registry = new Registry({
    // eslint-disable-next-line @typescript-eslint/require-await
    loadGrammar: async (scopeName: TextmateLanguageScope) => {
        switch (scopeName) {
            case "source.ts":
                return parseRawGrammar(typescriptTextmateGrammar);
            case "source.tsx":
                return parseRawGrammar(typescriptReactTextmateGrammar);
            case "source.json":
                return parseRawGrammar(jsonTextmateGrammar);
            default:
                return undefined;
        }
    },
});

export const parseFromLines = async (language: TextmateLanguage, lines: string[]): Promise<Optional<Token[]>> => {
    try {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        const grammar = await registry.loadGrammar(languageScopeNames.get(language) || "");
        return Optional.of(
            lines.reduce<[Token[], StackElement, number]>(
                ([previousAstTokens, previousRuleStack, lineIndex], line) => {
                    const { ruleStack, tokens } = grammar.tokenizeLine(line, previousRuleStack);
                    return [
                        [
                            ...previousAstTokens,
                            ...tokens.map(
                                ({ endIndex, scopes, startIndex }): Token => ({
                                    lineIndex,
                                    startIndex,
                                    endIndex,
                                    scopes: scopes as TextmateScope[],
                                    text: line.substring(startIndex, endIndex),
                                })
                            ),
                        ],
                        ruleStack,
                        lineIndex + 1,
                    ];
                },
                [[], INITIAL, 0]
            )[0]
        );
    } catch (error) {
        log.warn(`Unknown language: ${language}`);
        return Optional.empty();
    }
};

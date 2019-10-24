export const parseCompilerErrors = (content: string) =>
    content.replace(
        // Replace /* @CompilerError(...) */.../**/ directives with the compiler error highlight and tooltip.
        /<span class="token punctuation-definition-comment-ts(?:x)?"(?:.*?)>\/\*(?:.*?)@CompilerError\((.+?)\)(?:.*?)\*\/<\/span>(.+?)<span class="token punctuation-definition-comment-ts(?:x)?"(?:.*?)>\*\/<\/span>/g,
        (_: string, errorMessage: string, expression: string) => {
            // Replace manually written newlines using \n with escaped <br /> newlines and indent each line by one more
            // level.
            const [tooltipText] = errorMessage
                .split("\\n")
                .reduce<[string, number]>(
                    ([currentLines, currentIndent], line) => [
                        `${currentLines !== "" ? `${currentLines}<br />` : ""}${"&nbsp;".repeat(
                            currentIndent * 2
                        )}${line}`,
                        currentIndent + 1,
                    ],
                    ["", 0]
                );
            return `<span class="tooltip" data-tooltip-text="${tooltipText}"><span class="compiler-error">${expression}</span></span>`;
        }
    );

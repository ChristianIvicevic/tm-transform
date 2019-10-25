export const parseTypeHints = (content: string) =>
    content.replace(
        // Replace /* @TypeHint(type) */ directives with the corresponding type hints in the code.
        /<span class="token punctuation-definition-comment-ts(?:x)?"(?:.*?)>\/\*<\/span><span(?:.*?)>(?:\s*?):(?:\s*?)(.*?)<\/span><span(?:.*?)>\*\/<\/span>/g,
        (_: string, type: string) => `<span class="type-hint">: ${type.trim()}</span>`
    );

export const parseTypeHints = (content: string) =>
    content.replace(
        // Replace /* @TypeHint(type) */ directives with the corresponding type hints in the code.
        /<span class="token punctuation-definition-comment-ts(?:x)?"(?:.*?)>\/\*<\/span><span(?:.*?)>(?:\s*?):(?:\s*?)(.*?)<\/span><span(?:.*?)>\*\/<\/span>/g,
        '<span class="type-hint">:$1</span>'
    );

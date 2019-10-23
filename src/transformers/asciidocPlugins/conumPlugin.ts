// We need to save the conum in the original source by faking them to be comments with a unique form. Later we'll
// replace them with their actual icons again.
export const transformConums = (content: string) =>
    content.replace(/<i class="conum" data-value="(\d)"><\/i><b>\((\d)\)<\/b>/g, "// @Conum($1)");

export const parseConums = (content: string) =>
    content
        .replace(
            /<span class="token punctuation-definition-comment-ts(?:x)?"(?:[^>]*)>\/\/<\/span><span(?:[^>]*)>(?:\s*)@Conum\((\d)\)<\/span>/g,
            '<i class="conum" data-value="$1"></i>'
        )
        .replace(
            /<span class="token punctuation-definition-comment-ts(?:x)?"(?:[^>]*)>\/\/<\/span>(<span class="token comment-line-double-slash-ts(?:x)?"(?:[^>]*)>(?:\s*))@Conum\((\d)\)/g,
            (_: string, prefix: string, conum: string) =>
                `<span><i class="conum" data-value="${conum}"></i> </span>${prefix}`
        )
        .replace(
            /<span class="token comment-line-double-slash-ts(?:x)?"(?:[^>]*)>(?:\s*)\/\/(?:\s*)@Conum\((\d)\)<\/span>/g,
            '<span><i class="conum" data-value="$1"></i> </span>'
        )
        .replace(/\/\/(?:\s*?)@Conum\((\d)\)/g, '<i class="conum" data-value="$1"></i>');

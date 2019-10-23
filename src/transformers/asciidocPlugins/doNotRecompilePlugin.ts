export const doNotRecompileAnnotation = "<!-- @do-not-recompile -->";
export const prependDoNotRecompileAnnotation = (content: string) => [doNotRecompileAnnotation, content].join("\n");

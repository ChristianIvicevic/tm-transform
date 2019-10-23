// Map Asciidoctor data-lang attribute to Textmate scope names
export const supportedLanguages: Record<string, string> = {
    typescript: "source.ts",
    "typescript jsx": "source.tsx",
    json: "source.json",
};

export const grammarFiles: [string, string][] = [
    ["typescript", "./node_modules/TypeScript-TmLanguage/TypeScript.tmLanguage"],
    ["typescriptReact", "./node_modules/TypeScript-TmLanguage/TypeScriptReact.tmLanguage"],
    ["json", "./node_modules/vscode-JSON.tmLanguage/JSON.tmLanguage"],
];

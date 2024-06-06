import Mark from "./Mark";
export default class Highlight extends Mark {
    get name(): string;
    get schema(): {
        parseDOM: {
            tag: string;
        }[];
        toDOM: () => string[];
    };
    inputRules({ type }: {
        type: any;
    }): any[];
    keys({ type }: {
        type: any;
    }): {
        "Mod-Ctrl-h": any;
    };
    get rulePlugins(): ((md: any) => void)[];
    get toMarkdown(): {
        open: string;
        close: string;
        mixable: boolean;
        expelEnclosingWhitespace: boolean;
    };
    parseMarkdown(): {
        mark: string;
    };
}
//# sourceMappingURL=Highlight.d.ts.map
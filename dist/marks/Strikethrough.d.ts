import Mark from "./Mark";
export default class Strikethrough extends Mark {
    get name(): string;
    get schema(): {
        parseDOM: {
            tag: string;
        }[];
        toDOM: () => (string | number)[];
    };
    keys({ type }: {
        type: any;
    }): {
        "Mod-d": any;
    };
    inputRules({ type }: {
        type: any;
    }): any[];
    get toMarkdown(): {
        open: string;
        close: string;
        mixable: boolean;
        expelEnclosingWhitespace: boolean;
    };
    get markdownToken(): string;
    parseMarkdown(): {
        mark: string;
    };
}
//# sourceMappingURL=Strikethrough.d.ts.map
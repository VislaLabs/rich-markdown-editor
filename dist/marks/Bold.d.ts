import Mark from "./Mark";
export default class Bold extends Mark {
    get name(): string;
    get schema(): {
        parseDOM: ({
            tag: string;
            style?: undefined;
            getAttrs?: undefined;
        } | {
            style: string;
            getAttrs: (value: any) => boolean;
            tag?: undefined;
        })[];
        toDOM: () => string[];
    };
    inputRules({ type }: {
        type: any;
    }): any[];
    keys({ type }: {
        type: any;
    }): {
        "Mod-b": any;
        "Mod-B": any;
    };
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
//# sourceMappingURL=Bold.d.ts.map
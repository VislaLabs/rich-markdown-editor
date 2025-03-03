import Mark from "./Mark";
export default class Code extends Mark {
    get name(): string;
    get schema(): {
        excludes: string;
        parseDOM: {
            tag: string;
            preserveWhitespace: boolean;
        }[];
        toDOM: () => (string | {
            spellCheck: boolean;
        })[];
    };
    inputRules({ type }: {
        type: any;
    }): any[];
    keys({ type }: {
        type: any;
    }): {
        "Mod`": any;
        ArrowLeft: (state: any, dispatch: (tr: any) => void) => boolean;
        ArrowRight: (state: any, dispatch: (tr: any) => void) => boolean;
    };
    get toMarkdown(): {
        open(_state: any, _mark: any, parent: any, index: any): string;
        close(_state: any, _mark: any, parent: any, index: any): string;
        escape: boolean;
    };
    parseMarkdown(): {
        mark: string;
    };
}
//# sourceMappingURL=Code.d.ts.map
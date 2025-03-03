import Mark from "./Mark";
export default class Link extends Mark {
    get name(): string;
    get schema(): {
        attrs: {
            href: {
                default: string;
            };
        };
        inclusive: boolean;
        parseDOM: {
            tag: string;
            getAttrs: (dom: HTMLElement) => {
                href: string | null;
            };
        }[];
        toDOM: (node: any) => any[];
    };
    inputRules({ type }: {
        type: any;
    }): any[];
    commands({ type }: {
        type: any;
    }): ({ href }?: {
        href: string;
    }) => any;
    keys({ type }: {
        type: any;
    }): {
        "Mod-k": (state: any, dispatch: any) => any;
    };
    get plugins(): any[];
    get toMarkdown(): {
        open(_state: any, mark: any, parent: any, index: any): "[" | "<";
        close(state: any, mark: any, parent: any, index: any): string;
    };
    parseMarkdown(): {
        mark: string;
        getAttrs: (tok: any) => {
            href: any;
            title: any;
        };
    };
}
//# sourceMappingURL=Link.d.ts.map
import Node from "./Node";
export default class OrderedList extends Node {
    get name(): string;
    get schema(): {
        attrs: {
            order: {
                default: number;
            };
        };
        content: string;
        group: string;
        parseDOM: {
            tag: string;
            getAttrs: (dom: HTMLOListElement) => {
                order: number;
            };
        }[];
        toDOM: (node: any) => (string | number | {
            start: any;
        })[];
    };
    commands({ type, schema }: {
        type: any;
        schema: any;
    }): () => (state: any, dispatch: (tr: any) => void) => any;
    keys({ type, schema }: {
        type: any;
        schema: any;
    }): {
        "Shift-Ctrl-9": (state: any, dispatch: (tr: any) => void) => any;
    };
    inputRules({ type }: {
        type: any;
    }): any[];
    toMarkdown(state: any, node: any): void;
    parseMarkdown(): {
        block: string;
        getAttrs: (tok: any) => {
            order: number;
        };
    };
}
//# sourceMappingURL=OrderedList.d.ts.map
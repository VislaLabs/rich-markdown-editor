import Node from "./Node";
export default class BulletList extends Node {
    get name(): string;
    get schema(): {
        content: string;
        group: string;
        parseDOM: {
            tag: string;
        }[];
        toDOM: () => (string | number)[];
    };
    commands({ type, schema }: {
        type: any;
        schema: any;
    }): () => (state: any, dispatch: (tr: any) => void) => any;
    keys({ type, schema }: {
        type: any;
        schema: any;
    }): {
        "Shift-Ctrl-8": (state: any, dispatch: (tr: any) => void) => any;
    };
    inputRules({ type }: {
        type: any;
    }): any[];
    toMarkdown(state: any, node: any): void;
    parseMarkdown(): {
        block: string;
    };
}
//# sourceMappingURL=BulletList.d.ts.map
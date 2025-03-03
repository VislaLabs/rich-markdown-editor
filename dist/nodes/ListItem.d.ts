import Node from "./Node";
export default class ListItem extends Node {
    get name(): string;
    get schema(): {
        content: string;
        defining: boolean;
        draggable: boolean;
        parseDOM: {
            tag: string;
        }[];
        toDOM: () => (string | number)[];
    };
    get plugins(): any[];
    keys({ type }: {
        type: any;
    }): {
        Enter: any;
        Tab: any;
        "Shift-Tab": any;
        "Mod-]": any;
        "Mod-[": any;
        "Shift-Enter": (state: any, dispatch: any) => boolean;
        "Alt-ArrowUp": (state: any, dispatch: any) => boolean;
        "Alt-ArrowDown": (state: any, dispatch: any) => boolean;
    };
    toMarkdown(state: any, node: any): void;
    parseMarkdown(): {
        block: string;
    };
}
//# sourceMappingURL=ListItem.d.ts.map
import Node from "./Node";
import checkboxRule from "../rules/checkboxes";
export default class CheckboxItem extends Node {
    get name(): string;
    get schema(): {
        attrs: {
            checked: {
                default: boolean;
            };
        };
        content: string;
        defining: boolean;
        draggable: boolean;
        parseDOM: {
            tag: string;
            getAttrs: (dom: HTMLLIElement) => {
                checked: boolean;
            };
        }[];
        toDOM: (node: any) => (string | (string | number)[] | {
            "data-type": string;
            class: string | undefined;
        } | (string | HTMLInputElement | {
            contentEditable: boolean;
        })[])[];
    };
    get rulePlugins(): (typeof checkboxRule)[];
    handleChange: (event: any) => void;
    keys({ type }: {
        type: any;
    }): {
        Enter: any;
        Tab: any;
        "Shift-Tab": any;
        "Mod-]": any;
        "Mod-[": any;
    };
    toMarkdown(state: any, node: any): void;
    parseMarkdown(): {
        block: string;
        getAttrs: (tok: any) => {
            checked: boolean | undefined;
        };
    };
}
//# sourceMappingURL=CheckboxItem.d.ts.map
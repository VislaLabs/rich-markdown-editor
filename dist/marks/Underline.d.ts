import Mark from "./Mark";
import underlinesRule from "../rules/underlines";
export default class Underline extends Mark {
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
        toDOM: () => (string | number)[];
    };
    get rulePlugins(): (typeof underlinesRule)[];
    inputRules({ type }: {
        type: any;
    }): any[];
    keys({ type }: {
        type: any;
    }): {
        "Mod-u": any;
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
//# sourceMappingURL=Underline.d.ts.map
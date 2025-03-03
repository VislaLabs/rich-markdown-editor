import { Schema } from "prosemirror-model";
import { MarkdownParser } from "prosemirror-markdown";
import { MarkdownSerializer } from "./markdown/serializer";
import Editor from "../";
import Extension from "./Extension";
import { PluginSimple } from "markdown-it";
export default class ExtensionManager {
    extensions: Extension[];
    constructor(extensions?: Extension[], editor?: Editor);
    get nodes(): {};
    serializer(): MarkdownSerializer;
    parser({ schema, rules, plugins, }: {
        schema: any;
        rules?: Record<string, any>;
        plugins?: PluginSimple[];
    }): MarkdownParser;
    get marks(): {};
    get plugins(): any[];
    get rulePlugins(): PluginSimple[];
    keymaps({ schema }: {
        schema: Schema;
    }): any[];
    inputRules({ schema }: {
        schema: Schema;
    }): any[];
    commands({ schema, view }: {
        schema: any;
        view: any;
    }): {};
}
//# sourceMappingURL=ExtensionManager.d.ts.map
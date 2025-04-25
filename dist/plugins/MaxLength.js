import { Plugin } from "prosemirror-state";
import Extension from "../lib/Extension";
export default class MaxLength extends Extension {
    get name() {
        return "maxlength";
    }
    get plugins() {
        return [
            new Plugin({
                filterTransaction: (tr) => {
                    if (this.options.maxLength) {
                        const result = tr.doc && tr.doc.nodeSize > this.options.maxLength;
                        return !result;
                    }
                    return true;
                },
            }),
        ];
    }
}
//# sourceMappingURL=MaxLength.js.map
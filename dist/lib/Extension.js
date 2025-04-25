export default class Extension {
    constructor(options = {}) {
        this.options = {
            ...this.defaultOptions,
            ...options,
        };
    }
    bindEditor(editor) {
        this.editor = editor;
    }
    get type() {
        return "extension";
    }
    get name() {
        return "";
    }
    get plugins() {
        return [];
    }
    get rulePlugins() {
        return [];
    }
    keys(options) {
        return {};
    }
    inputRules(options) {
        return [];
    }
    commands(options) {
        return attrs => () => false;
    }
    get defaultOptions() {
        return {};
    }
}
//# sourceMappingURL=Extension.js.map
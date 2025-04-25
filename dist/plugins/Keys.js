import { Plugin, Selection, AllSelection, TextSelection, } from "prosemirror-state";
import { GapCursor } from "prosemirror-gapcursor";
import Extension from "../lib/Extension";
import isModKey from "../lib/isModKey";
export default class Keys extends Extension {
    get name() {
        return "keys";
    }
    get plugins() {
        return [
            new Plugin({
                props: {
                    handleDOMEvents: {
                        blur: this.options.onBlur,
                        focus: this.options.onFocus,
                    },
                    handleKeyDown: (view, event) => {
                        if (view.state.selection instanceof AllSelection) {
                            if (event.key === "ArrowUp") {
                                const selection = Selection.atStart(view.state.doc);
                                view.dispatch(view.state.tr.setSelection(selection));
                                return true;
                            }
                            if (event.key === "ArrowDown") {
                                const selection = Selection.atEnd(view.state.doc);
                                view.dispatch(view.state.tr.setSelection(selection));
                                return true;
                            }
                        }
                        if (view.state.selection instanceof GapCursor) {
                            if (event.key === "Enter") {
                                view.dispatch(view.state.tr.insert(view.state.selection.from, view.state.schema.nodes.paragraph.create({})));
                                view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(view.state.selection.from), -1)));
                                return true;
                            }
                        }
                        if (!isModKey(event)) {
                            return false;
                        }
                        if (event.key === "s") {
                            event.preventDefault();
                            this.options.onSave();
                            return true;
                        }
                        if (event.key === "Enter") {
                            event.preventDefault();
                            this.options.onSaveAndExit();
                            return true;
                        }
                        if (event.key === "Escape") {
                            event.preventDefault();
                            this.options.onCancel();
                            return true;
                        }
                        return false;
                    },
                },
            }),
        ];
    }
}
//# sourceMappingURL=Keys.js.map
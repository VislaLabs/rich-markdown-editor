import { InputRule } from "prosemirror-inputrules";
import { Plugin } from "prosemirror-state";
import Extension from "../lib/Extension";
import isInCode from "../queries/isInCode";
import { run } from "./BlockMenuTrigger";
const OPEN_REGEX = /(?:^|\s):([0-9a-zA-Z_+-]+)?$/;
const CLOSE_REGEX = /(?:^|\s):(([0-9a-zA-Z_+-]*\s+)|(\s+[0-9a-zA-Z_+-]+)|[^0-9a-zA-Z_+-]+)$/;
export default class EmojiTrigger extends Extension {
    get name() {
        return "emojimenu";
    }
    get plugins() {
        return [
            new Plugin({
                props: {
                    handleClick: () => {
                        this.options.onClose();
                        return false;
                    },
                    handleKeyDown: (view, event) => {
                        if (event.key === "Backspace") {
                            setTimeout(() => {
                                const { pos } = view.state.selection.$from;
                                return run(view, pos, pos, OPEN_REGEX, (state, match) => {
                                    if (match) {
                                        this.options.onOpen(match[1]);
                                    }
                                    else {
                                        this.options.onClose();
                                    }
                                    return null;
                                });
                            });
                        }
                        if (event.key === "Enter" ||
                            event.key === "ArrowUp" ||
                            event.key === "ArrowDown" ||
                            event.key === "Tab") {
                            const { pos } = view.state.selection.$from;
                            return run(view, pos, pos, OPEN_REGEX, (state, match) => {
                                return match ? true : null;
                            });
                        }
                        return false;
                    },
                },
            }),
        ];
    }
    inputRules() {
        return [
            new InputRule(OPEN_REGEX, (state, match) => {
                if (match &&
                    state.selection.$from.parent.type.name === "paragraph" &&
                    !isInCode(state)) {
                    this.options.onOpen(match[1]);
                }
                return null;
            }),
            new InputRule(CLOSE_REGEX, (state, match) => {
                if (match) {
                    this.options.onClose();
                }
                return null;
            }),
        ];
    }
}
//# sourceMappingURL=EmojiTrigger.js.map
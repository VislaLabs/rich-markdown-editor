import { Plugin } from "prosemirror-state";
import { isInTable } from "prosemirror-tables";
import { toggleMark } from "prosemirror-commands";
import Extension from "../lib/Extension";
import isUrl from "../lib/isUrl";
import isMarkdown from "../lib/isMarkdown";
import selectionIsInCode from "../queries/isInCode";
import { LANGUAGES } from "./Prism";
function normalizePastedMarkdown(text) {
    const CHECKBOX_REGEX = /^\s?(\[(X|\s|_|-)\]\s(.*)?)/gim;
    while (text.match(CHECKBOX_REGEX)) {
        text = text.replace(CHECKBOX_REGEX, match => `- ${match.trim()}`);
    }
    return text;
}
export default class PasteHandler extends Extension {
    get name() {
        return "markdown-paste";
    }
    get plugins() {
        return [
            new Plugin({
                props: {
                    handlePaste: (view, event) => {
                        if (view.props.editable && !view.props.editable(view.state)) {
                            return false;
                        }
                        if (!event.clipboardData)
                            return false;
                        const text = event.clipboardData.getData("text/plain");
                        const html = event.clipboardData.getData("text/html");
                        const vscode = event.clipboardData.getData("vscode-editor-data");
                        const { state, dispatch } = view;
                        if (isUrl(text)) {
                            if (!state.selection.empty) {
                                toggleMark(this.editor.schema.marks.link, { href: text })(state, dispatch);
                                return true;
                            }
                            const { embeds } = this.editor.props;
                            if (embeds && !isInTable(state)) {
                                for (const embed of embeds) {
                                    const matches = embed.matcher(text);
                                    if (matches) {
                                        this.editor.commands.embed({
                                            href: text,
                                        });
                                        return true;
                                    }
                                }
                            }
                            const transaction = view.state.tr
                                .insertText(text, state.selection.from, state.selection.to)
                                .addMark(state.selection.from, state.selection.to + text.length, state.schema.marks.link.create({ href: text }));
                            view.dispatch(transaction);
                            return true;
                        }
                        if (selectionIsInCode(view.state)) {
                            event.preventDefault();
                            view.dispatch(view.state.tr.insertText(text));
                            return true;
                        }
                        const vscodeMeta = vscode ? JSON.parse(vscode) : undefined;
                        const pasteCodeLanguage = vscodeMeta === null || vscodeMeta === void 0 ? void 0 : vscodeMeta.mode;
                        if (pasteCodeLanguage && pasteCodeLanguage !== "markdown") {
                            event.preventDefault();
                            view.dispatch(view.state.tr
                                .replaceSelectionWith(view.state.schema.nodes.code_fence.create({
                                language: Object.keys(LANGUAGES).includes(vscodeMeta.mode)
                                    ? vscodeMeta.mode
                                    : null,
                            }))
                                .insertText(text));
                            return true;
                        }
                        if (html === null || html === void 0 ? void 0 : html.includes("data-pm-slice")) {
                            return false;
                        }
                        if (isMarkdown(text) ||
                            html.length === 0 ||
                            pasteCodeLanguage === "markdown") {
                            event.preventDefault();
                            const paste = this.editor.pasteParser.parse(normalizePastedMarkdown(text));
                            const slice = paste.slice(0);
                            const transaction = view.state.tr.replaceSelection(slice);
                            view.dispatch(transaction);
                            return true;
                        }
                        return false;
                    },
                },
            }),
        ];
    }
}
//# sourceMappingURL=PasteHandler.js.map
import { Plugin, Selection } from "prosemirror-state";
import copy from "copy-to-clipboard";
import { Decoration, DecorationSet } from "prosemirror-view";
import { textblockTypeInputRule } from "prosemirror-inputrules";
import backspaceToParagraph from "../commands/backspaceToParagraph";
import toggleBlockType from "../commands/toggleBlockType";
import splitHeading from "../commands/splitHeading";
import headingToSlug, { headingToPersistenceKey } from "../lib/headingToSlug";
import Node from "./Node";
import { ToastType } from "../types";
export default class Heading extends Node {
    constructor() {
        super(...arguments);
        this.className = "heading-name";
        this.handleFoldContent = event => {
            event.preventDefault();
            const { view } = this.editor;
            const hadFocus = view.hasFocus();
            const { tr } = view.state;
            const { top, left } = event.target.getBoundingClientRect();
            const result = view.posAtCoords({ top, left });
            if (result) {
                const node = view.state.doc.nodeAt(result.inside);
                if (node) {
                    const endOfHeadingPos = result.inside + node.nodeSize;
                    const $pos = view.state.doc.resolve(endOfHeadingPos);
                    const collapsed = !node.attrs.collapsed;
                    if (collapsed && view.state.selection.to > endOfHeadingPos) {
                        tr.setSelection(Selection.near($pos, -1));
                    }
                    const transaction = tr.setNodeMarkup(result.inside, undefined, {
                        ...node.attrs,
                        collapsed,
                    });
                    const persistKey = headingToPersistenceKey(node, this.editor.props.id);
                    if (collapsed) {
                        localStorage === null || localStorage === void 0 ? void 0 : localStorage.setItem(persistKey, "collapsed");
                    }
                    else {
                        localStorage === null || localStorage === void 0 ? void 0 : localStorage.removeItem(persistKey);
                    }
                    view.dispatch(transaction);
                    if (hadFocus) {
                        view.focus();
                    }
                }
            }
        };
        this.handleCopyLink = event => {
            const anchor = event.currentTarget.parentNode.parentNode.previousSibling;
            if (!anchor.className.includes(this.className)) {
                throw new Error("Did not find anchor as previous sibling of heading");
            }
            const hash = `#${anchor.id}`;
            const urlWithoutHash = window.location.href.split("#")[0];
            copy(urlWithoutHash + hash);
            if (this.options.onShowToast) {
                this.options.onShowToast(this.options.dictionary.linkCopied, ToastType.Info);
            }
        };
    }
    get name() {
        return "heading";
    }
    get defaultOptions() {
        return {
            levels: [1, 2, 3, 4],
            collapsed: undefined,
        };
    }
    get schema() {
        return {
            attrs: {
                level: {
                    default: 1,
                },
                collapsed: {
                    default: undefined,
                },
            },
            content: "inline*",
            group: "block",
            defining: true,
            draggable: false,
            parseDOM: this.options.levels.map(level => ({
                tag: `h${level}`,
                attrs: { level },
                contentElement: ".heading-content",
            })),
            toDOM: node => {
                const anchor = document.createElement("button");
                anchor.innerText = "#";
                anchor.type = "button";
                anchor.className = "heading-anchor";
                anchor.addEventListener("click", event => this.handleCopyLink(event));
                const fold = document.createElement("button");
                fold.innerText = "";
                fold.innerHTML =
                    '<svg fill="currentColor" width="12" height="24" viewBox="6 0 12 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.23823905,10.6097108 L11.207376,14.4695888 L11.207376,14.4695888 C11.54411,14.907343 12.1719566,14.989236 12.6097108,14.652502 C12.6783439,14.5997073 12.7398293,14.538222 12.792624,14.4695888 L15.761761,10.6097108 L15.761761,10.6097108 C16.0984949,10.1719566 16.0166019,9.54410997 15.5788477,9.20737601 C15.4040391,9.07290785 15.1896811,9 14.969137,9 L9.03086304,9 L9.03086304,9 C8.47857829,9 8.03086304,9.44771525 8.03086304,10 C8.03086304,10.2205442 8.10377089,10.4349022 8.23823905,10.6097108 Z" /></svg>';
                fold.type = "button";
                fold.className = `heading-fold ${node.attrs.collapsed ? "collapsed" : ""}`;
                fold.addEventListener("mousedown", event => this.handleFoldContent(event));
                return [
                    `h${node.attrs.level + (this.options.offset || 0)}`,
                    [
                        "span",
                        {
                            contentEditable: false,
                            class: `heading-actions ${node.attrs.collapsed ? "collapsed" : ""}`,
                        },
                        anchor,
                        fold,
                    ],
                    [
                        "span",
                        {
                            class: "heading-content",
                        },
                        0,
                    ],
                ];
            },
        };
    }
    toMarkdown(state, node) {
        state.write(state.repeat("#", node.attrs.level) + " ");
        state.renderInline(node);
        state.closeBlock(node);
    }
    parseMarkdown() {
        return {
            block: "heading",
            getAttrs: (token) => ({
                level: +token.tag.slice(1),
            }),
        };
    }
    commands({ type, schema }) {
        return (attrs) => {
            return toggleBlockType(type, schema.nodes.paragraph, attrs);
        };
    }
    keys({ type, schema }) {
        const options = this.options.levels.reduce((items, level) => ({
            ...items,
            ...{
                [`Shift-Ctrl-${level}`]: toggleBlockType(type, schema.nodes.paragraph, { level }),
            },
        }), {});
        return {
            ...options,
            Backspace: backspaceToParagraph(type),
            Enter: splitHeading(type),
        };
    }
    get plugins() {
        const getAnchors = doc => {
            const decorations = [];
            const previouslySeen = {};
            doc.descendants((node, pos) => {
                if (node.type.name !== this.name)
                    return;
                const slug = headingToSlug(node);
                let id = slug;
                if (previouslySeen[slug] > 0) {
                    id = headingToSlug(node, previouslySeen[slug]);
                }
                previouslySeen[slug] =
                    previouslySeen[slug] !== undefined ? previouslySeen[slug] + 1 : 1;
                decorations.push(Decoration.widget(pos, () => {
                    const anchor = document.createElement("a");
                    anchor.id = id;
                    anchor.className = this.className;
                    return anchor;
                }, {
                    side: -1,
                    key: id,
                }));
            });
            return DecorationSet.create(doc, decorations);
        };
        const plugin = new Plugin({
            state: {
                init: (config, state) => {
                    return getAnchors(state.doc);
                },
                apply: (tr, oldState) => {
                    return tr.docChanged ? getAnchors(tr.doc) : oldState;
                },
            },
            props: {
                decorations: state => plugin.getState(state),
            },
        });
        return [plugin];
    }
    inputRules({ type }) {
        return this.options.levels.map(level => textblockTypeInputRule(new RegExp(`^(#{1,${level}})\\s$`), type, () => ({
            level,
        })));
    }
}
//# sourceMappingURL=Heading.js.map
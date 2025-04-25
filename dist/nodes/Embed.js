import * as React from "react";
import Node from "./Node";
import embedsRule from "../rules/embeds";
const cache = {};
export default class Embed extends Node {
    get name() {
        return "embed";
    }
    get schema() {
        return {
            content: "inline*",
            group: "block",
            atom: true,
            attrs: {
                href: {},
            },
            parseDOM: [
                {
                    tag: "iframe[class=embed]",
                    getAttrs: (dom) => {
                        const { embeds } = this.editor.props;
                        const href = dom.getAttribute("src") || "";
                        if (embeds) {
                            for (const embed of embeds) {
                                const matches = embed.matcher(href);
                                if (matches) {
                                    return {
                                        href,
                                    };
                                }
                            }
                        }
                        return {};
                    },
                },
            ],
            toDOM: node => [
                "iframe",
                { class: "embed", src: node.attrs.href, contentEditable: false },
                0,
            ],
        };
    }
    get rulePlugins() {
        return [embedsRule(this.options.embeds)];
    }
    component({ isEditable, isSelected, theme, node }) {
        const { embeds } = this.editor.props;
        const hit = cache[node.attrs.href];
        let Component = hit ? hit.Component : undefined;
        let matches = hit ? hit.matches : undefined;
        if (!Component) {
            for (const embed of embeds) {
                const m = embed.matcher(node.attrs.href);
                if (m) {
                    Component = embed.component;
                    matches = m;
                    cache[node.attrs.href] = { Component, matches };
                }
            }
        }
        if (!Component) {
            return null;
        }
        return (React.createElement(Component, { attrs: { ...node.attrs, matches }, isEditable: isEditable, isSelected: isSelected, theme: theme }));
    }
    commands({ type }) {
        return attrs => (state, dispatch) => {
            dispatch(state.tr.replaceSelectionWith(type.create(attrs)).scrollIntoView());
            return true;
        };
    }
    toMarkdown(state, node) {
        state.ensureNewLine();
        state.write("[" + state.esc(node.attrs.href) + "](" + state.esc(node.attrs.href) + ")");
        state.write("\n\n");
    }
    parseMarkdown() {
        return {
            node: "embed",
            getAttrs: token => ({
                href: token.attrGet("href"),
            }),
        };
    }
}
//# sourceMappingURL=Embed.js.map
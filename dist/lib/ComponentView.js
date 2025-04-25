import * as React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "styled-components";
import { light as lightTheme, dark as darkTheme } from "../styles/theme";
export default class ComponentView {
    constructor(component, { editor, extension, node, view, getPos, decorations }) {
        this.isSelected = false;
        this.component = component;
        this.editor = editor;
        this.extension = extension;
        this.getPos = getPos;
        this.decorations = decorations;
        this.node = node;
        this.view = view;
        this.dom = node.type.spec.inline
            ? document.createElement("span")
            : document.createElement("div");
        this.root = ReactDOM.createRoot(this.dom);
        this.renderElement();
    }
    renderElement() {
        const { dark } = this.editor.props;
        const theme = this.editor.props.theme || (dark ? darkTheme : lightTheme);
        const children = this.component({
            theme,
            node: this.node,
            isSelected: this.isSelected,
            isEditable: this.view.editable,
            getPos: this.getPos,
        });
        this.root.render(React.createElement(ThemeProvider, { theme: theme }, children));
    }
    update(node) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.node = node;
        this.renderElement();
        return true;
    }
    selectNode() {
        if (this.view.editable) {
            this.isSelected = true;
            this.renderElement();
        }
    }
    deselectNode() {
        if (this.view.editable) {
            this.isSelected = false;
            this.renderElement();
        }
    }
    stopEvent() {
        return true;
    }
    destroy() {
        if (this.dom) {
            this.root.unmount();
        }
        this.dom = null;
    }
    ignoreMutation() {
        return true;
    }
}
//# sourceMappingURL=ComponentView.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_dom_1 = require("react-dom");
const theme_1 = require("../styles/theme");
class ElementView {
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
            ? document.createElement('span')
            : document.createElement('div');
    }
    render() {
        if (!this.dom) {
            return null;
        }
        const { dark } = this.editor.props;
        const theme = this.editor.props.theme || (dark ? theme_1.dark : theme_1.light);
        const children = this.component({
            theme,
            node: this.node,
            isSelected: this.isSelected,
            isEditable: this.view.editable,
            getPos: this.getPos,
        });
        return react_dom_1.createPortal(children, this.dom);
    }
    update(newNode) {
        if (newNode.type !== this.node.type) {
            return false;
        }
        this.node = newNode;
        this.editor.scheduleNodeViewUpdate(this);
        return true;
    }
    selectNode() {
        if (this.view.editable) {
            this.isSelected = true;
            this.editor.scheduleNodeViewUpdate(this);
        }
    }
    deselectNode() {
        if (this.view.editable) {
            this.isSelected = false;
            this.editor.scheduleNodeViewUpdate(this);
        }
    }
    stopEvent() {
        return true;
    }
    destroy() {
        this.dom = null;
    }
    ignoreMutation() {
        return true;
    }
}
exports.default = ElementView;
//# sourceMappingURL=ElementView.js.map